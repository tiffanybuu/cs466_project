# for pretty printing the dp matrix 
def printDP(a):
    for row in a:
        for col in row:
            print("{:8.3f}".format(col), end=" ")
        print("")


def get_base_pairing(x, y):
    pairs = [('A','U'), ('U', 'A'), ('G', 'C'), ('C', 'G')]
    if (x,y) in pairs:
        return 1
    return 0

def get_max_score(sequence):
    n = len(sequence)

    sequence = [c.upper() for c in sequence]

    dp = [[0 for _ in range(n)] for _ in range(n)]


    # loop through graph diagonally
    for x in range(1,n):
        for i in range(0,n-x):
            if i == 0:
                j = x 
            else:
                j += 1
            if i < j:
                # bifurcation option
                bifurcation = 0
                for k in range(i+1, j): 
                    bifurcation = max(dp[i][k] + dp[k+1][j], bifurcation)

                # get max value
                dp[i][j] = max(dp[i+1][j-1] + get_base_pairing(sequence[i], sequence[j]),
                                dp[i+1][j],
                                dp[i][j-1],
                                bifurcation
                                )

    # printDP(dp)
    # max score
    return dp[0][n-1]

# getting reference score 
def get_score(s):
    counter = 0

    s = [c for c in s]
    for c in s:
        if c == '(':
            counter += 1
    print(counter)


print(get_max_score('GUUUCCAUCCCCGUGAGGGGAAUAAGUGUUUUGAA'))
get_score('.(((....((((....))))....)))........')