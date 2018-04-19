const whitespace = require('is-whitespace-character')

const C_MARK = '!'
const DOUBLE = '!!'

function locator (value, fromIndex) {
  const index = value.indexOf(DOUBLE, fromIndex)
  return index
}

function plugin () {
  function inlineTokenizer (eat, value, silent) {
    if (
      !this.options.gfm ||
      value.charAt(0) !== C_MARK ||
      value.charAt(1) !== C_MARK ||
      value.startsWith(C_MARK.repeat(4)) ||
      whitespace(value.charAt(2))
    ) {
      return
    }

    let character = ''
    let previous = ''
    let preceding = ''
    let subvalue = value.substr(2)
    let index = subvalue.length
    const now = eat.now()
    now.column += 2
    now.offset += 2

    while (--index >= 0) {
      character = subvalue.charAt(index)

      if (
        preceding === C_MARK &&
        previous === C_MARK &&
        (!character || !whitespace(character))
      ) {

        /* istanbul ignore if - never used (yet) */
        if (silent) return true

        return eat(DOUBLE + subvalue + DOUBLE)({
          type: 'mark',
          children: this.tokenizeInline(subvalue, now),
          data: {
            hName: 'mark',
          },
        })
      }

      subvalue = subvalue.slice(0, -1)
      preceding = previous
      previous = character
    }
  }
  inlineTokenizer.locator = locator

  const Parser = this.Parser

  // Inject inlineTokenizer
  const inlineTokenizers = Parser.prototype.inlineTokenizers
  const inlineMethods = Parser.prototype.inlineMethods
  inlineTokenizers.mark = inlineTokenizer
  inlineMethods.splice(inlineMethods.indexOf('text'), 0, 'mark')

  const Compiler = this.Compiler

  // Stringify
  if (Compiler) {
    const visitors = Compiler.prototype.visitors
    visitors.mark = function (node) {
      return `!!${this.all(node).join('')}!!`
    }
  }
}

module.exports = plugin
