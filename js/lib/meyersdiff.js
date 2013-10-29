
window.HtmlDiff = {
  formatTextDiff: function(originalText, finalText) {
    var finalDiff;
    finalDiff = this.makeDiff(originalText, finalText);
    finalDiff = this.aggregateDiff(finalDiff);
    finalDiff = this.filterRemovedSpaces(finalDiff);
    return this.formatDiff(finalDiff);
  },
  makeDiff: function(originalText, finalText) {
    var changeType, diff, diffIndex, finalDiff, initialPlain, lastChangeType, plainChanges, plainDiff, plainPreChange, plainText, plainTextChange, postChange, preChange, replacePos, scramble, text, textChange, updatedPlain, _ref, _ref1,
      _this = this;
    originalText = this.fixEntities(originalText);
    finalText = this.fixEntities(finalText);
    initialPlain = this.sanitizePlainText(originalText);
    updatedPlain = this.sanitizePlainText(finalText);
    plainDiff = diff_match_patch.prototype.diff_main(initialPlain, updatedPlain);
    diff_match_patch.prototype.diff_cleanupSemantic(plainDiff);
    if (plainDiff.length === 1) {
      return [[DIFF_EQUAL, finalText]];
    }
    plainChanges = this.makeSmallestPlainChanges(plainDiff);
    diff = diff_match_patch.prototype.diff_main(originalText, finalText);
    diff_match_patch.prototype.diff_cleanupSemantic(diff);
    diff = this.makeSmallestMarkupChanges(diff);
    finalDiff = [];
    diffIndex = 0;
    while (diffIndex < diff.length) {
      _ref = diff[diffIndex], changeType = _ref[0], text = _ref[1];
      plainTextChange = text;
      textChange = null;
      if (plainTextChange.length) {
        textChange = _.find(plainChanges, function(_arg, index) {
          var plainChange, plainText, scramble;
          plainChange = _arg[0], plainText = _arg[1];
          scramble = _this.scrambleMarkup(plainTextChange, plainText);
          if ((scramble.indexOf(plainText) > -1) && (changeType === plainChange) && (changeType !== DIFF_EQUAL)) {
            plainChanges.splice(0, index + 1);
            return true;
          }
        });
      }
      if (textChange) {
        plainText = textChange[1];
        scramble = this.scrambleMarkup(text, plainText);
        replacePos = scramble.indexOf(this.scrambleMarkup(plainText, plainText));
        preChange = text.substr(0, replacePos);
        plainPreChange = this.sanitizePlainText(preChange);
        postChange = text.substr(replacePos + plainText.length);
        lastChangeType = (_ref1 = finalDiff[finalDiff.length - 1]) != null ? _ref1[0] : void 0;
        if ((lastChangeType === DIFF_DELETE && changeType === DIFF_INSERT) && plainPreChange.length) {
          finalDiff.push([DIFF_INSERT, preChange]);
        } else {
          finalDiff.push([DIFF_EQUAL, preChange]);
        }
        finalDiff.push([changeType, plainText]);
        if (postChange.length) {
          diff.splice(diffIndex + 1, 0, [changeType, postChange]);
        }
      } else {
        if (changeType === DIFF_DELETE) {
          if (text.match(/^\s+$/)) {
            finalDiff.push([DIFF_DELETE, text]);
          }
        } else {
          finalDiff.push([DIFF_EQUAL, text]);
        }
      }
      diffIndex++;
    }
    return finalDiff;
  },
  scrambleMarkup: function(markup, text) {
    var scramble, scrambler;
    scrambler = function(content) {
      return content.replace(text, text.substr(1).concat("~"));
    };
    scramble = markup.replace(/(<[^>]*>)/g, scrambler);
    scramble = scramble.replace(/^([a-zA-Z]*>)/, scrambler);
    scramble = scramble.replace(/(<[a-zA-Z]*)$/, scrambler);
    if (!text.match(/&[^;]+;/)) {
      scramble = scramble.replace(/(&[^;]*;)/g, scrambler);
    }
    return scramble;
  },
  makeSmallestPlainChanges: function(plainDiff) {
    var change, content, deletion, index, insertion, plainChanges, pos, prefix, suffix, _i, _len, _ref, _ref1, _ref2;
    plainChanges = [];
    for (index = _i = 0, _len = plainDiff.length; _i < _len; index = ++_i) {
      _ref = plainDiff[index], change = _ref[0], content = _ref[1];
      if (change === DIFF_DELETE && ((_ref1 = plainDiff[index + 1]) != null ? _ref1[0] : void 0) === DIFF_INSERT) {
        deletion = content;
        insertion = plainDiff[index + 1][1];
        if ((pos = insertion.indexOf(deletion)) > -1) {
          prefix = insertion.substr(0, pos).replace(/^\s+/, '').replace(/\s+$/, '');
          suffix = insertion.substr(pos + deletion.length).replace(/^\s+/, '').replace(/\s+$/, '');
          this.addDiffPart(plainChanges, DIFF_INSERT, prefix);
          this.addDiffPart(plainChanges, DIFF_INSERT, suffix);
        } else if ((pos = deletion.indexOf(insertion)) > -1) {
          prefix = deletion.substr(0, pos).replace(/^\s+/, '').replace(/\s+$/, '');
          suffix = deletion.substr(pos + insertion.length).replace(/^\s+/, '').replace(/\s+$/, '');
          this.addDiffPart(plainChanges, DIFF_DELETE, prefix);
          this.addDiffPart(plainChanges, DIFF_DELETE, suffix);
        } else {
          this.addDiffPart(plainChanges, DIFF_DELETE, deletion);
          this.addDiffPart(plainChanges, DIFF_INSERT, insertion);
        }
      } else if (change === DIFF_INSERT && ((_ref2 = plainDiff[index - 1]) != null ? _ref2[0] : void 0) === DIFF_DELETE) {

      } else if (change !== DIFF_EQUAL) {
        this.addDiffPart(plainChanges, change, content);
      }
    }
    return plainChanges;
  },
  addDiffPart: function(diff, change, text) {
    var plainText, word, _i, _len, _ref, _results;
    plainText = $("<div>").text(text).html();
    plainText = this.sanitizeSpaces(plainText);
    _ref = plainText.split(/\s+/);
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      word = _ref[_i];
      _results.push(diff.push([change, word]));
    }
    return _results;
  },
  makeSmallestMarkupChanges: function(markupDiff) {
    var change, content, deletedParts, deletion, deletions, equals, index, insertedParts, insertion, inserts, intersected, markupChanges, pos, prefix, suffix, text, _i, _len, _ref, _ref1, _ref2;
    this.consoleDiff(markupDiff);
    this.completeTags(markupDiff);
    this.consoleDiff(markupDiff);
    markupChanges = [];
    for (index = _i = 0, _len = markupDiff.length; _i < _len; index = ++_i) {
      _ref = markupDiff[index], change = _ref[0], content = _ref[1];
      if (change === DIFF_DELETE && ((_ref1 = markupDiff[index + 1]) != null ? _ref1[0] : void 0) === DIFF_INSERT) {
        deletion = content;
        insertion = markupDiff[index + 1][1];
        if ((pos = insertion.indexOf(deletion)) > -1) {
          prefix = insertion.substr(0, pos);
          suffix = insertion.substr(pos + deletion.length);
          this.addMarkupDiff(markupChanges, DIFF_INSERT, prefix);
          this.addMarkupDiff(markupChanges, DIFF_EQUAL, deletion);
          this.addMarkupDiff(markupChanges, DIFF_INSERT, suffix);
        } else if ((pos = deletion.indexOf(insertion)) > -1) {
          prefix = deletion.substr(0, pos);
          suffix = deletion.substr(pos + insertion.length);
          this.addMarkupDiff(markupChanges, DIFF_DELETE, prefix);
          this.addMarkupDiff(markupChanges, DIFF_EQUAL, insertion);
          this.addMarkupDiff(markupChanges, DIFF_DELETE, suffix);
        } else {
          deletions = [];
          this.addMarkupDiff(deletions, DIFF_DELETE, deletion);
          inserts = [];
          this.addMarkupDiff(inserts, DIFF_INSERT, insertion);
          deletedParts = (function() {
            var _j, _len1, _ref2, _results;
            _results = [];
            for (_j = 0, _len1 = deletions.length; _j < _len1; _j++) {
              _ref2 = deletions[_j], change = _ref2[0], text = _ref2[1];
              _results.push(text);
            }
            return _results;
          })();
          insertedParts = (function() {
            var _j, _len1, _ref2, _results;
            _results = [];
            for (_j = 0, _len1 = inserts.length; _j < _len1; _j++) {
              _ref2 = inserts[_j], change = _ref2[0], text = _ref2[1];
              _results.push(text);
            }
            return _results;
          })();
          equals = [];
          intersected = _.reject(_.intersection(deletedParts, insertedParts), function(elem) {
            return elem.match(/^\s+$/);
          });
          if (intersected.length > 0) {
            while ((deletions[0] != null) && (deletions[0][1] !== intersected[0])) {
              markupChanges.push(deletions.shift());
            }
            while ((inserts[0] != null) && (inserts[0][1] !== intersected[0])) {
              markupChanges.push(inserts.shift());
            }
            while ((inserts[0] != null) && (deletions[0] != null) && (inserts[0][1] === deletions[0][1])) {
              equals.push([DIFF_EQUAL, inserts[0][1]]);
              inserts.shift();
              deletions.shift();
            }
          }
          markupChanges = markupChanges.concat(equals).concat(deletions).concat(inserts);
        }
      } else if (change === DIFF_INSERT && ((_ref2 = markupDiff[index - 1]) != null ? _ref2[0] : void 0) === DIFF_DELETE) {

      } else {
        this.addMarkupDiff(markupChanges, change, content);
      }
    }
    return markupChanges;
  },
  addMarkupDiff: function(diff, change, text) {
    var item, items, _i, _len, _results;
    items = this.splitCollect(text, /\s+|<[^>]+>/g);
    _results = [];
    for (_i = 0, _len = items.length; _i < _len; _i++) {
      item = items[_i];
      _results.push(diff.push([change, item]));
    }
    return _results;
  },
  splitCollect: function(text, separator) {
    var collection, element, elements, sep, splittings, _i, _len;
    elements = text.split(separator);
    splittings = [];
    text.replace(separator, function(content) {
      return splittings.push(content);
    });
    collection = [];
    for (_i = 0, _len = elements.length; _i < _len; _i++) {
      element = elements[_i];
      if (element.length) {
        collection.push(element);
      }
      sep = splittings.shift();
      if (sep != null) {
        collection.push(sep);
      }
    }
    return collection;
  },
  tagStart: /<[\w\/]*$/,
  tagEnd: /^[\/\w]*>/,
  completeTags: function(markupDiff) {
    var change, content, index, result, _i, _len, _ref, _results;
    _results = [];
    for (index = _i = 0, _len = markupDiff.length; _i < _len; index = ++_i) {
      _ref = markupDiff[index], change = _ref[0], content = _ref[1];
      if (change === DIFF_EQUAL) {
        if (result = content.match(this.tagStart)) {
          markupDiff[index][1] = content.replace(this.tagStart, '');
          this.placeTagStart(result[0], markupDiff, index + 1);
        }
        if (result = content.match(this.tagEnd)) {
          markupDiff[index][1] = content.replace(this.tagEnd, '');
          _results.push(this.placeTagEnd(result[0], markupDiff, index - 1));
        } else {
          _results.push(void 0);
        }
      } else {
        _results.push(void 0);
      }
    }
    return _results;
  },
  placeTagStart: function(tagStart, diff, position) {
    var change, negate, newTag, nextEnd, passOnProblem, res, tagEnd, _ref, _results;
    _results = [];
    while ((diff[position] != null) && ((_ref = diff[position]) != null ? _ref[0] : void 0) !== DIFF_EQUAL) {
      if (tagEnd = diff[position][1].match(this.tagEnd)) {
        diff[position][1] = "" + tagStart + diff[position][1];
        if (res = diff[position][1].match(this.tagStart)) {
          if (res[0] !== tagStart) {
            if ((diff[position + 1] != null) && (nextEnd = diff[position + 1][1].match(this.tagEnd))) {
              if (tagEnd[0] === nextEnd[0]) {
                newTag = "" + tagStart + tagEnd[0];
                diff[position - 1][1] = "" + diff[position - 1][1] + newTag;
                diff[position][1] = diff[position][1].substr(newTag.length);
              }
            }
          }
        }
      } else {
        if ((diff[position + 1] != null) && (nextEnd = diff[position + 1][1].match(this.tagEnd))) {
          change = diff[position];
          change[1] = "" + tagStart + diff[position][1] + nextEnd[0];
          negate = [diff[position][0] * -1, "" + tagStart + nextEnd[0]];
          diff.splice(position, 0, negate[0] === DIFF_DELETE ? negate : change);
          position++;
          diff[position] = change[0] === DIFF_DELETE ? negate : change;
          diff[position + 1][1] = diff[position + 1][1].replace(this.tagEnd, '');
          passOnProblem = false;
        }
      }
      _results.push(position++);
    }
    return _results;
  },
  placeTagEnd: function(tagEnd, diff, position) {
    var _ref, _results;
    _results = [];
    while ((diff[position] != null) && ((_ref = diff[position]) != null ? _ref[0] : void 0) !== DIFF_EQUAL) {
      if (diff[position][1].match(this.tagStart)) {
        diff[position][1] = "" + diff[position][1] + tagEnd;
      }
      _results.push(position--);
    }
    return _results;
  },
  sanitizePlainText: function(text) {
    var plainText;
    plainText = $("<div>" + (text.replace(/>/g, "> ")) + "</div>").text();
    return plainText = this.sanitizeSpaces(plainText);
  },
  sanitizeSpaces: function(plainText) {
    return plainText = plainText.replace(/\s+/g, " ").replace(/^\s*/, "").replace(/\s*$/, "");
  },
  htmlText: function(text) {
    var plainText;
    plainText = $("<div>" + (text.replace(/>/g, "> ")) + "</div>").text();
    return $("<div>").text(plainText).html();
  },
  formatDiff: function(diff) {
    var change, html, text, _i, _len, _ref;
    html = [];
    for (_i = 0, _len = diff.length; _i < _len; _i++) {
      _ref = diff[_i], change = _ref[0], text = _ref[1];
      switch (change) {
        case DIFF_INSERT:
          html.push("<ins>" + text + "</ins>");
          break;
        case DIFF_DELETE:
          html.push("<del>" + text + "</del>");
          break;
        case DIFF_EQUAL:
          html.push(text);
      }
    }
    return html.join('');
  },
  aggregateDiff: function(diff) {
    var aggregatedDiff, change, content, index, lastChange, lastChangePos, lastChangeType, lastContent, lastPos, previousChangeType, previousContent, spaces, _i, _len, _ref, _ref1, _ref2;
    aggregatedDiff = [diff[0]];
    spaces = [];
    lastChangeType = aggregatedDiff[0][0];
    for (index = _i = 0, _len = diff.length; _i < _len; index = ++_i) {
      _ref = diff[index], change = _ref[0], content = _ref[1];
      if (!(index > 0)) {
        continue;
      }
      lastPos = aggregatedDiff.length - 1;
      _ref1 = aggregatedDiff[lastPos], lastChange = _ref1[0], lastContent = _ref1[1];
      if (change === lastChange) {
        aggregatedDiff[lastPos][1] = lastContent.concat(content);
      } else {
        lastChangePos = aggregatedDiff.length - 2;
        if (lastChangePos >= 0) {
          _ref2 = aggregatedDiff[lastChangePos], previousChangeType = _ref2[0], previousContent = _ref2[1];
          if ((previousChangeType === change) && (lastChange === DIFF_EQUAL) && (lastContent.match(/^\s*$/))) {
            aggregatedDiff[lastChangePos][1] = previousContent.concat(lastContent).concat(content);
            aggregatedDiff.pop();
          } else {
            aggregatedDiff.push([change, content]);
          }
        } else {
          aggregatedDiff.push([change, content]);
        }
      }
    }
    return aggregatedDiff;
  },
  fixEntities: function(text) {
    return $("<div>" + text + "</div>").html();
  },
  consoleDiff: function(diff) {
    var change, items, sign, text;
    if (typeof console === "undefined" || console === null) {
      return;
    }
    items = (function() {
      var _i, _len, _ref, _ref1, _results;
      _ref = _.clone(diff);
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        _ref1 = _ref[_i], change = _ref1[0], text = _ref1[1];
        sign = "";
        if (change === DIFF_INSERT) {
          sign = "+";
        }
        if (change === DIFF_DELETE) {
          sign = "-";
        }
        _results.push("" + sign + text);
      }
      return _results;
    })();
    return console.log(items);
  },
  filterRemovedSpaces: function(diff) {
    var filtered;
    return filtered = _.select(diff, function(_arg) {
      var change, content;
      change = _arg[0], content = _arg[1];
      if (change === DIFF_DELETE && content.match(/^\s+$/)) {
        return false;
      } else {
        return true;
      }
    });
  }
};

