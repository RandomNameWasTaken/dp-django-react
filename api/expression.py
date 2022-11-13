class Expression:

    def eval(self, state):
        pass

class SimpleExpr(Expression):

    def __init__(self, name):
        self.name = name

    def eval(self, state):
        return state[self.name] == '1'

class NegExpr(Expression):

    def __init__(self, expr):
        self.expr = expr

    def eval(self, state):
        return not(self.expr.eval(state))

class CompExpr(Expression):

    def __init__(self, expr1, expr2, function, orig_char):
        self.expr1 = expr1
        self.expr2 = expr2
        self.function = function
        self.orig_char = orig_char

    def eval(self, state):
        a = self.expr1.eval(state)
        b = self.expr2.eval(state)

        res =  self.function(a, b)
        return res


