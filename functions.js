// DOM searching
var querySelector = (selector) => document.querySelector(selector)
var querySelectorAll = selector => document.querySelectorAll(selector)
// DOM manipulating
var addClass = (node, className) => node.classList.add(className)
var removeClass = (node, className) => node.classList.remove(className)

var replaceHtml = (node, newHtml) => node.innerHTML = newHtml ? newHtml : ''
var appendHtml = (parent, position, template) => parent.insertAdjacentHTML(position, template)

// state
var createObj = curry((curState, changes) => Object.assign(curState, changes))

//_______FP_______//
// curry :: ((a, b, ...) -> c) -> a -> b -> ... -> c
function curry(fn) {
  const arity = fn.length

  return function $curry(...args) {
    if (args.length < arity) {
      return $curry.bind(null, ...args)
    }

    return fn.call(null, ...args)
  }
}
// compose :: ((a -> b), (b -> c),  ..., (y -> z)) -> a -> z
var compose = (...fns) => (...args) => fns.reduceRight((res, fn) => [fn.call(null, ...res)], args)[0]
// filter :: (a -> Boolean) -> [a] -> [a]
var filter = curry((fn, xs) => xs.filter(fn))
// map :: Functor f => (a -> b) -> f a -> f b
var map = curry((fn, f) => f.map(fn))