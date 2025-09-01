#!/usr/bin/env python3
"""
Test Python file for debugging AST parsing issues.
This file contains various Python constructs to test the parser.
"""

import os
import sys
from typing import List, Dict, Optional


class TestClass:
    """A test class with various methods."""
    
    def __init__(self, name: str):
        """Initialize the test class."""
        self.name = name
        self.data = {}
    
    def simple_method(self) -> str:
        """A simple method that returns a string."""
        return f"Hello from {self.name}"
    
    def method_with_params(self, param1: int, param2: str = "default") -> Dict[str, any]:
        """A method with parameters and default values."""
        return {
            "param1": param1,
            "param2": param2,
            "name": self.name
        }
    
    @property
    def formatted_name(self) -> str:
        """A property method."""
        return self.name.upper()


def standalone_function(items: List[str]) -> Optional[str]:
    """A standalone function outside of any class."""
    if not items:
        return None
    
    result = []
    for item in items:
        if isinstance(item, str):
            result.append(item.strip())
    
    return " ".join(result)


def function_with_nested_logic():
    """Function with nested logic to test complex parsing."""
    data = {
        "numbers": [1, 2, 3, 4, 5],
        "strings": ["a", "b", "c"]
    }
    
    # List comprehension
    squared = [x**2 for x in data["numbers"] if x % 2 == 0]
    
    # Nested function
    def inner_function(value):
        return value * 2
    
    # Lambda function
    multiply_by_three = lambda x: x * 3
    
    return {
        "squared": squared,
        "doubled": [inner_function(x) for x in data["numbers"]],
        "tripled": [multiply_by_three(x) for x in data["numbers"]]
    }


if __name__ == "__main__":
    # Test the classes and functions
    test_obj = TestClass("TestInstance")
    print(test_obj.simple_method())
    print(test_obj.method_with_params(42, "custom"))
    print(test_obj.formatted_name)
    
    test_list = ["  hello  ", "  world  ", "  python  "]
    print(standalone_function(test_list))
    
    complex_result = function_with_nested_logic()
    print(complex_result)
