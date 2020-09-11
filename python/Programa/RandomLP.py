print(" ------------ Lotofacil -------------")

import random
lst = [] 
ns = int(input("Quantidade de sequencias: "))
n2 = int(input("Quantidade de numeros totais: ")) 
#n2 = 15

n = int(input("Quantidade de numeros fixos: "))
 
for i in range(0, n): 
	ele = int(input()) 
	lst.append(ele) 

print("Numeros fixos: " + str(lst)) 

dn = n2 - n

rng = []
for i in range(1,26):
  if i not in lst:
    rng.append(i)


for j in range(ns):
  aux = []
  aux.extend(lst)
  aux.extend(random.sample(rng,dn))
  print(aux)


print("")
x = input("Aperte enter para fechar.")