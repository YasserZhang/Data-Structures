import random
class Heap:
    
    def __init__(self, cmpr = None, key = None):
        self.heap = []
        self._cmpr = cmpr
        self._key = key
        
    def _get_left_child_index(self, index):
        return (index * 2) + 1
    def _get_right_child_index(self, index):
        return (index * 2) + 2
    def _get_parent_index(self, index):
        return (index - 1) / 2

    def _get_left_child(self, left_child_index):
        return self.heap[left_child_index]
    def _get_right_child(self, right_child_index):
        return self.heap[right_child_index]
    def _get_parent(self, parent_index):
        return self.heap[parent_index]

    def _has_left_child(self, index):
        return self._get_left_child_index(index) < len(self.heap)
    def _has_right_child(self, index):
        return self._get_right_child_index(index) < len(self.heap)
    def _has_parent(self, index):
        return self._get_parent_index(index) >= 0

    def insert(self, item):
        self.heap.append(item)
        self._fix_up()

    def _fix_up(self):
        #print self.heap
        cur = len(self.heap) - 1
        child = self.heap[cur]
        while self._has_parent(cur):
            parent_index = self._get_parent_index(cur)
            parent = self._get_parent(parent_index)
            #print child, parent
            if parent > child:
                self.heap[cur] = parent
                cur = parent_index
            else:
                #print cur
                self.heap[cur] = child
                return
        self.heap[cur] = child

    def remove(self):
        assert len(self.heap) > 0
        #print 'heap size before pop', self.size()
        deleted = self.heap[0]
        self.heap[0] = self.heap[-1]
        self.heap.pop()
        #print 'heap size:', self.size()
        self._fix_down()
        return deleted
        

    def _fix_down(self):
        if len(self.heap) == 0:
            return
        cur_idx = 0
        parent = self.heap[cur_idx]
        while self._has_left_child(cur_idx):
            child_index = self._get_left_child_index(cur_idx)
            child = self._get_left_child(child_index)
            if self._has_right_child(cur_idx):
                right_child_index = self._get_right_child_index(cur_idx)
                right_child = self._get_right_child(right_child_index)
                if right_child < child:
                    child = right_child
                    child_index = right_child_index
            if parent > child:
                self.heap[cur_idx] = child
                cur_idx = child_index
            else:
                self.heap[cur_idx] = parent
                return
        self.heap[cur_idx] = parent
    def print_heap(self):
        print(self.heap)

    def size(self):
        return len(self.heap)

if __name__ == '__main__':
    A = [3, 4, 8, 9, 7, 10, 9, 15, 20, 13, 9, 14, 20, 11, 19, 20, 17]
    #A = [8, 3, 2,9]
    random.shuffle(A)
    heap = Heap()
    for a in A:
        heap.insert(a)
    heap.print_heap()
    def kthLargestElement2(nums, k):
    # write your code here
        heap = Heap()
        for num in nums:
            heap.insert(num)
            if heap.size() > k:
                heap.remove()
        return heap.remove()
    print kthLargestElement2(A, 4)
    
