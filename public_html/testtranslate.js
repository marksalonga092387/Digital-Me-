let lang = {
    "sentence": "私は$[name]をあげられる$[sva-apples]を$[apples]個持っています。 $[sva-apples]をもう$[apples]個。",
    "apples": ["apple","apples"]
};

function renderSentence(sentence, words) {
    var replaceHolders = [];
    var replacers = [];
    var sentenceToReturn = sentence;
    if (words != null) {
        for (let word in words) {
            if (/sva-*/g.test(word)) {
                var splitword = word.split("-");
                replaceHolders.push("$["+splitword[1]+"]");
                replacers.push(words[word][0]);
                replaceHolders.push("$["+word+"]");
                if (word[0]==1) {
                    replacers.push(words[word][1])
                } else {
                    if (typeof words[word][2] == "undefined") replacers.push(words[word][1]);
                    else replacers.push(words[word][2])
                }
            } else {
                replaceHolders.push("$["+word+"]");
                replacers.push(words[word])
            }
        }
        console.log(replaceHolders);
        console.log(replacers);
        for (var i = 0; i < replaceHolders.length; i++) {
            sentenceToReturn = sentenceToReturn.split(replaceHolders[i]).join(replacers[i]);
        }
    }
    return sentenceToReturn
}

console.log(renderSentence(lang.sentence, {
    "sva-apples": [2, "リンゴ", "リンゴ"],
    "name": "ジンキー"
}));