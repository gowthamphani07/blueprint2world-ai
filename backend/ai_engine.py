import cv2
import numpy as np


class PerfectBlueprintAI:

    def __init__(self):
        print("Blueprint parser ready")


    def process_image(self, image_bgr):

        mask = self._segment_walls(image_bgr)

        outer = self._detect_outer_walls(mask)

        inner = self._detect_inner_walls(mask)

        walls = outer + inner

        rooms = self._detect_rooms(mask)

        return {
            "walls": walls,
            "rooms": rooms,
            "doors": [],
            "windows": []
        }


    # ------------------------------------------------
    # WALL SEGMENTATION
    # ------------------------------------------------

    def _segment_walls(self, image):

        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

        # detect dark walls
        _, mask = cv2.threshold(gray,160,255,cv2.THRESH_BINARY_INV)

        kernel = np.ones((7,7),np.uint8)

        mask = cv2.morphologyEx(mask,cv2.MORPH_CLOSE,kernel,iterations=2)

        return mask


    # ------------------------------------------------
    # OUTER WALL DETECTION
    # ------------------------------------------------

    def _detect_outer_walls(self, mask):

        contours,_ = cv2.findContours(mask,cv2.RETR_EXTERNAL,cv2.CHAIN_APPROX_SIMPLE)

        if not contours:
            return []

        largest = max(contours,key=cv2.contourArea)

        x,y,w,h = cv2.boundingRect(largest)

        walls = [
            [x,y,x+w,y],
            [x,y,x,y+h],
            [x+w,y,x+w,y+h],
            [x,y+h,x+w,y+h]
        ]

        return walls


    # ------------------------------------------------
    # INNER WALL DETECTION
    # ------------------------------------------------

    def _detect_inner_walls(self, mask):

        walls = []

        # horizontal walls
        kernel_h = cv2.getStructuringElement(cv2.MORPH_RECT,(60,1))
        horizontal = cv2.morphologyEx(mask,cv2.MORPH_OPEN,kernel_h)

        contours,_ = cv2.findContours(horizontal,cv2.RETR_LIST,cv2.CHAIN_APPROX_SIMPLE)

        for cnt in contours:

            x,y,w,h = cv2.boundingRect(cnt)

            if w > 60:

                walls.append([x,y,x+w,y])


        # vertical walls
        kernel_v = cv2.getStructuringElement(cv2.MORPH_RECT,(1,60))
        vertical = cv2.morphologyEx(mask,cv2.MORPH_OPEN,kernel_v)

        contours,_ = cv2.findContours(vertical,cv2.RETR_LIST,cv2.CHAIN_APPROX_SIMPLE)

        for cnt in contours:

            x,y,w,h = cv2.boundingRect(cnt)

            if h > 60:

                walls.append([x,y,x,y+h])

        return walls


    # ------------------------------------------------
    # ROOM DETECTION
    # ------------------------------------------------

    def _detect_rooms(self, mask):

        # close door gaps
        kernel = np.ones((15,15),np.uint8)
        closed = cv2.morphologyEx(mask,cv2.MORPH_CLOSE,kernel)

        room_mask = cv2.bitwise_not(closed)

        num_labels, labels, stats, _ = cv2.connectedComponentsWithStats(room_mask)

        rooms = []

        for i in range(1,num_labels):

            x = int(stats[i,cv2.CC_STAT_LEFT])
            y = int(stats[i,cv2.CC_STAT_TOP])
            w = int(stats[i,cv2.CC_STAT_WIDTH])
            h = int(stats[i,cv2.CC_STAT_HEIGHT])
            area = int(stats[i,cv2.CC_STAT_AREA])

            if area < 4000:
                continue

            polygon = [
                [x,y],
                [x+w,y],
                [x+w,y+h],
                [x,y+h]
            ]

            rooms.append({
                "polygon": polygon,
                "type": "room"
            })

        return rooms


blueprint_ai = PerfectBlueprintAI()