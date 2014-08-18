// Script to pre-process the asciidoc sources for generating LaTeX.
// Adjusts some stylistic things to satisfy No Starch's style, and
// fixes up svg images to point at pdf versions of the images.

var fs = require("fs"), child = require("child_process");

var infile = process.argv[2], instream;
if (infile == "-") {
  instream = process.stdin;
  instream.resume();
} else {
  instream = fs.createReadStream(infile);
}

var titleCaseSmallWords = "a an the at by for in of on to up and as but it or nor if console.log".split(" ");

var input = "";
instream.on("data", function(chunk) {
  input += chunk;
});
instream.on("end", function() {
  if (infile != "-")
    input = ":docid: " + infile.match(/^\d{2}_(.*?)\.txt/)[1] + "\n" + input;
  process.stdout.write(input.replace(/\n===? (.*?) ===?|”([.,:;])|\nimage::img\/(.+?)\.(svg)|link:[^\.]+\.html#(.*?)\[|!!(hint)!![^]+?!!hint!!(?:\n|$)/g,
                                     function(match, title, quoted, imgName, imgType, link, solution) {
    if (title) { // Section title, must be converted to title case
      var kind = /^\n(=*)/.exec(match)[1];
      return "\n" + kind + " " + title.split(" ").map(function(word) {
        if (titleCaseSmallWords.indexOf(word) == -1)
          return word[0].toUpperCase() + word.slice(1);
        else
          return word;
      }).join(" ") + " " + kind;
    } else if (quoted) { // Move punctuation into quotes
      return quoted + "”";
    } else if (imgName) { // Image file
      return "\nimage::" + convertImage(imgName, imgType);
    } else if (link) {
      return "link:" + link + "[";
    } else if (solution) {
      return "";
    }
  }));
});

function convertImage(name, type) {
  if (type == "svg") {
    var oldName = "img/" + name + "." + type, newName = "img/generated/" + name + ".pdf";
    try {
      var newAge = fs.statSync(newName).atime;
    } catch (e) {
      newAge = 0;
    }
    return newName;
  } else {
    return oldName;
  }
}
