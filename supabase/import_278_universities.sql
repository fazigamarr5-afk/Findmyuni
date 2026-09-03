[eval]:29
  const asiaRank = (uni['Asia Rank'] || 'Not ranked').replace(/'/g, "''");
                                                      ^

TypeError: (uni.Asia Rank || "Not ranked").replace is not a function
    at [eval]:29:55
    at Array.forEach (<anonymous>)
    at [eval]:23:14
    at runScriptInThisContext (node:internal/vm:219:10)
    at node:internal/process/execution:451:12
    at [eval]-wrapper:6:24
    at runScriptInContext (node:internal/process/execution:449:60)
    at evalFunction (node:internal/process/execution:283:30)
    at evalTypeScript (node:internal/process/execution:295:3)
    at node:internal/main/eval_string:71:3

Node.js v24.14.0
