class Heap:
	def __init__(self, cmpr = None, key = None):
		self.heap = []
		self.cmpr = cmpr
		self.key = key

	def get_left_child_index(self, index):
		return (index * 2) + 1
	def get_right_child_index(self, index):
		return (index * 2) + 2
	def get_parent_index(self, index):
		return (index - 1) / 2

	def get_left_child(self, left_child_index):
		return self.heap[left_child_index]
	def get_right_child(self, right_child_index):
		return self.heap[right_child_index]
	def get_parent(self, parent_index):
		return self.heap[parent_index]

	def has_left_child(self, index):
		return self.get_left_child_index(index) < len(self.heap)
	def has_right_child(self, index):
		return self.get_right_child_index(index) < len(self.heap)
	def has_parent(self, index):
		return self.get_parent_index(index) >= 0

	def insert(self, item):
		self.heap.append(item)
		self.fix_up()

	def fix_up(self):
		cur = len(self.heap) - 1
		child = self.heap[cur]
		while has_parent(cur):
			parent_index = get_parent_index(cur)
			parent = get_parent(parent_index)
			if parent > child:
				self.heap[cur] = parent
				cur = parent_index
			else:
				self.heap[cur] = child
				return

	def remove(self):
		assert len(self.heap) > 0
		deleted = self.heap[0]
		self.heap[0] = self.heap[-1]
		self.heap.pop()
		self.fix_down()

	def fix_down(self):
		if len(self.heap) == 0:
			return
		cur = 0
		parent = self.heap[cur]
		while has_left_child(cur):
			child_index = get_left_child_index(cur)
			child = get_left_child(child_index)
			if has_right_child(cur):
				right_child_index = get_right_child_index(cur)
				right_child = get_right_child(right_child_index)
				if right_child < child:
					child = right_child
					child_index = right_child_index
				if parent > child:
					self.heap[cur] = child 
					cur = child_index
				else:
					self.heap[cur] = parent
					return
