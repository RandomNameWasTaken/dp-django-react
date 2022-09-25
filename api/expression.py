class Expression:

    def eval(self, state, parametrization):
        pass

class SimpleExpr(Expression):

    def __init__(self, name):
        self.name = name

    def eval(self, state, parametrization):
        return state[self.name] == '1'

class NegExpr(Expression):

    def __init__(self, expr):
        self.expr = expr

    def eval(self, state, parametrization):
        return not(self.expr.eval(state, parametrization))

class CompExpr(Expression):

    def __init__(self, expr1, expr2, function, orig_char):
        self.expr1 = expr1
        self.expr2 = expr2
        self.function = function
        self.orig_char = orig_char

    def eval(self, state, parametrization):
        a = self.expr1.eval(state, parametrization)
        b = self.expr2.eval(state, parametrization)

        res =  self.function(a, b)
        return res


