'use strict';

/******************************************************************************
 * Created 2008-08-19.
 *
 * Dijkstra path-finding functions. Adapted from the Dijkstar Python project.
 *
 * Copyright (C) 2008
 *   Wyatt Baldwin <self@wyattbaldwin.com>
 *   All rights reserved
 *
 * Licensed under the MIT license.
 *
 *   http://www.opensource.org/licenses/mit-license.php
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 *****************************************************************************/
var dijkstra = {
  single_source_shortest_paths: function(graph, s, d) {
    // Predecessor map for each node that has been encountered.
    // node ID => predecessor node ID
    var predecessors = {};

    // Costs of shortest paths from s to all nodes encountered.
    // node ID => cost
    var costs = {};
    costs[s] = 0;

    // Costs of shortest paths from s to all nodes encountered; differs from
    // `costs` in that it provides easy access to the node that currently has
    // the known shortest path from s.
    // XXX: Do we actually need both `costs` and `open`?
    var open = dijkstra.PriorityQueue.make();
    open.push(s, 0);

    var closest,
        u, v,
        cost_of_s_to_u,
        adjacent_nodes,
        cost_of_e,
        cost_of_s_to_u_plus_cost_of_e,
        cost_of_s_to_v,
        first_visit;
    while (!open.empty()) {
      // In the nodes remaining in graph that have a known cost from s,
      // find the node, u, that currently has the shortest path from s.
      closest = open.pop();
      u = closest.value;
      cost_of_s_to_u = closest.cost;

      // Get nodes adjacent to u...
      adjacent_nodes = graph[u] || {};

      // ...and explore the edges that connect u to those nodes, updating
      // the cost of the shortest paths to any or all of those nodes as
      // necessary. v is the node across the current edge from u.
      for (v in adjacent_nodes) {
        if (adjacent_nodes.hasOwnProperty(v)) {
          // Get the cost of the edge running from u to v.
          cost_of_e = adjacent_nodes[v];

          // Cost of s to u plus the cost of u to v across e--this is *a*
          // cost from s to v that may or may not be less than the current
          // known cost to v.
          cost_of_s_to_u_plus_cost_of_e = cost_of_s_to_u + cost_of_e;

          // If we haven't visited v yet OR if the current known cost from s to
          // v is greater than the new cost we just found (cost of s to u plus
          // cost of u to v across e), update v's cost in the cost list and
          // update v's predecessor in the predecessor list (it's now u).
          cost_of_s_to_v = costs[v];
          first_visit = (typeof costs[v] === 'undefined');
          if (first_visit || cost_of_s_to_v > cost_of_s_to_u_plus_cost_of_e) {
            costs[v] = cost_of_s_to_u_plus_cost_of_e;
            open.push(v, cost_of_s_to_u_plus_cost_of_e);
            predecessors[v] = u;
          }
        }
      }
    }

    if (typeof d !== 'undefined' && typeof costs[d] === 'undefined') {
      var msg = ['Could not find a path from ', s, ' to ', d, '.'].join('');
      throw new Error(msg);
    }

    return predecessors;
  },

  extract_shortest_path_from_predecessor_list: function(predecessors, d) {
    var nodes = [];
    var u = d;
    var predecessor;
    while (u) {
      nodes.push(u);
      predecessor = predecessors[u];
      u = predecessors[u];
    }
    nodes.reverse();
    return nodes;
  },

  find_path: function(graph, s, d) {
    var predecessors = dijkstra.single_source_shortest_paths(graph, s, d);
    return dijkstra.extract_shortest_path_from_predecessor_list(
      predecessors, d);
  },

  /**
   * Priority queue implementation.
   */
  PriorityQueue: {
    make: function (opts) {
      var T = dijkstra.PriorityQueue,
          t = {},
          key;
      opts = opts || {};
      for (key in T) {
        if (T.hasOwnProperty(key)) {
          t[key] = T[key];
        }
      }
      t.queue = dijkstra.MinHeap.make(T.default_sorter.bind(t));
      t.priorities = {};
      return t;
    },

    default_sorter: function (a, b) {
      return this.priorities[a] - this.priorities[b];
    },

    /**
     * Add a new item to the queue and ensure the highest priority element
     * is at the front of the queue.
     */
    push: function (value, cost) {
      this.priorities[value] = cost;
      this.queue.insert(value);
    },

    /**
     * Return the highest priority element in the queue.
     */
    pop: function () {
      var next_node_value = this.queue.pop();
      var next_node_cost = this.priorities[next_node_value];
      delete this.priorities[next_node_value];

      var next_node = {
        value: next_node_value,
        cost: next_node_cost
      };
      return next_node;
    },

    empty: function () {
      return this.queue.empty();
    }
  },

  /**
   * Min heap implementation.
   */
  MinHeap: {
    make: function (sorter) {
      var heap = {};
      var minHeap = dijkstra.MinHeap;
      for (var key in minHeap) {
        if (minHeap.hasOwnProperty(key)) {
          heap[key] = minHeap[key];
        }
      } 
      heap.sorter = sorter;
      heap.container = [];

      return heap;
    },
    /**
     * Finding parents or children with indexes.
     */
    get_left_child_index(parent_index) {
      return (2 * parent_index) + 1;
    },
    get_right_child_index(parent_index) {
      return (2 * parent_index) + 2;
    },
    get_parent_index(child_index) {
      return Math.floor((child_index - 1) / 2);
    },
    has_parent(child_index) {
      return this.get_parent_index(child_index) >= 0;
    },
    has_left_child(parent_index) {
      return this.get_left_child_index(parent_index) < this.container.length;
    },
    has_right_child(parent_index) {
      return this.get_right_child_index(parent_index) < this.container.length;
    },
    left_child(parent_index) {
      return this.container[this.get_left_child_index(parent_index)];
    },
    right_child(parent_index) {
      return this.container[this.get_right_child_index(parent_index)];
    },
    parent(child_index) {
      return this.container[this.get_parent_index(child_index)];
    },
    swap(first, second) {
      var tmp = this.container[second];
      this.container[second] = this.container[first];
      this.container[first] = tmp;
    },

    /**
     * Returns element with the highest priority. 
     */
    pop() {
      if (this.container.length === 1) {
        return this.container.pop();
      }
  
      var head_index = 0;
      var last_element = this.container.pop();
      var first_element = this.container[head_index];
  
      this.container[head_index] = last_element;
      this.heapify_down(head_index);
  
      return first_element;
    },  

    insert(value) {
      this.container.push(value);
      this.heapify_up(this.container.length - 1);
    },

    heapify_up(start_index) {
      var current_index = start_index || this.container.length - 1;
  
      while (
        this.has_parent(current_index) && 
        !this.pair_is_in_correct_order(
          this.parent(current_index), 
          this.container[current_index])
      ) {
        this.swap(current_index, this.get_parent_index(current_index));
        current_index = this.get_parent_index(current_index);
      }
    },
    
    heapify_down(start_index = 0) {
      var current_index = start_index;
      var next_index = null;
  
      while (this.has_left_child(current_index)) {
        if (
          this.has_parent(current_index) && 
          this.pair_is_in_correct_order(
            this.right_child(current_index), 
            this.left_child(current_index))
        ) {
          next_index = this.get_right_child_index(current_index);
        } else {
          next_index = this.get_left_child_index(current_index);
        }
  
        if (this.pair_is_in_correct_order(
          this.container[current_index],
          this.container[next_index]
        )) {
          break;
        }
  
        this.swap(current_index, next_index);
        current_index = next_index;
      }
    },
    empty() {
      return this.container.length === 0;
    },
    pair_is_in_correct_order(a, b) {
      return this.sorter(a, b) < 0;
    }
  }
};


// node.js module exports
if (typeof module !== 'undefined') {
  module.exports = dijkstra;
}
