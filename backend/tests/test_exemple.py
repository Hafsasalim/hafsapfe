# Une fonction très simple qu'on veut tester (en vrai, elle serait dans ton code)
def additionner(a, b):
    return a + b

# Le test unitaire associé
def test_additionner_positifs():
    # On vérifie que 2 + 3 donne bien 5
    assert additionner(2, 3) == 5

def test_additionner_negatifs():
    # On vérifie que -1 + -1 donne bien -2
    assert additionner(-1, -1) == -2