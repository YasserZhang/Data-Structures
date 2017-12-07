"""
credit to https://rosettacode.org/wiki/AVL_tree#Python
"""
class AVLNode(object):
	"""A node in the AVL tree."""
	def __init__(self, parent, k):
		self.key = k
		self.parent = parent
		self.left = None
		self.right = None

	def _str(self):
		"""Internal method for ASCII art. print the tree out!!!"""

	def __str__(self):
		return '\n'.join(self._str()[0])

	def find(self, k):
		"""Finds and returns the node with key k from the subtree rooted at this
		node.

		Args: 
			k: The key of the node we want to find.

		Returns:
			The node with key k.
		"""
		if k == self.key:
			return self
		elif k < self.key:
			if self.left is None:
				return None
			else:
				return self.left.find(k)
		else:
			if self.right is None:
				return None
			else:
				return self.right.find(k)

	def find_min(self):
		"""Finds the node with the minimum key in the subtree rooted at this node.

		Returns: 
			The node with the minimum key.
		"""

		current = self
		while current.left is not None:
			current = current.left
		return current

	def next_larger(self):
		
		#Returns the node with the next larger key (the successor) in the BST.
		
		# if self has right child, next larger can be found at right branch
		if self.right is not None:
			return self.right.find_min()
		# if self has no right child, then next larger can only be its parent.
		current = self
		while current.parent is not None and current is current.parent.right:
			current = current.parent
		return current.parent

	def insert(self, node):
		"""
		Inserts a node into the subtree rooted at this node.

		Args:
			node: The node to be inserted.
		"""
		if node is None:
			return
		if node.key < self.key:
			if self.left is None:
				node.parent = self
				self.left = node
			else:
				self.left.insert(node)
		else:
			if self.right is None:
				node.parent = self
				self.right = node
			else:
				self.right.insert(node)

	def delete(self):
		# deletes and returns the node from the tree.
		#in case where self has only one or no child.
		if self.left is None or self.right is None:
			if self is self.parent.left:
				self.parent.left = self.left or self.right
				if self.parent.left is not None:
					self.parent.left.parent = self.parent
			else:
				self.parent.right = self.left or self.right
				if self.parent.right is not None:
					self.parent.right.parent = self.parent
			return self
		# in case where self has two children.
		# switch key value with next larger node, until updated
		# self node has no or one child, call delete.
		else:
			s = self.next_larger()
			self.key, s.key = s.key, self.key
			return s.delete()



class AVL(object):
	"""
	AVL binary search tree implementation.
	"""

	def __init__(self):
		""" empty tree """
		self.root = None

	def __str__(self):
		if self.root is None: return '<empty tree>'
		return str(self.root)

	def find(self, k):
		"""
		Finds and returns the node with key k from the subtree rooted at this
		node.

		Args: 
			k: The key of the node we want to find.

		Returns:
			The node with key k or None if the tree is empty.
		"""
		return self.root and self.root.find(k)

	def find_min(self):
		"""
		Returns the minimum node of this BST.
		"""
		return self.root and self.root.find_min()

	def next_larger(self, k):
		node = self.find(k)
		return node and node.next_larger()

	def left_rotate(self, x):
		y = x.right
		
