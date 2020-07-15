// languageProcessor.js

module.exports = {
    renderSentence: renderSentence
}

function renderSentence(sentence, words) {
    var replaceHolders = []
    var replacers = []
    var sentenceToReturn = sentence
    if (words != null) {
        for (let word in words) {
            if (/sva-*/g.test(word)) {
                var splitword = word.split("-")
                replaceHolders.push("$["+splitword[1]+"]")
                replacers.push(words[word][0])
                replaceHolders.push("$["+word+"]")
                if (word[0]==1) {
                    replacers.push(words[word][1])
                } else {
                    if (typeof words[word][2] == "undefined") replacers.push(words[word][1])
                    else replacers.push(words[word][2])
                }
            } else {
                replaceHolders.push("$["+word+"]")
                replacers.push(words[word])
            }
        }
        for (var i = 0; i < replaceHolders.length; i++) {
            sentenceToReturn = sentenceToReturn.split(replaceHolders[i]).join(replacers[i])
        }
    }
    return sentenceToReturn
}