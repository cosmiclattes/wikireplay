(function($){
var schnark_diff = {
/*
This script implements a diff algorithm able to detect block moves.
 
Author: Schnark ([http://de.wikipedia.org/wiki/Benutzer:Schnark]) */
version: 1.15, /*
License: choose any of GFDL, CC-by-sa, GPL
Documentation: [[Benutzer:Schnark/js/diff/core]]
 
Uses mw.html.escape,
*/
/*global mw: true */
//<nowiki>
 
config: {
 char_diff: 1, //how often to split up words, 0 to disable
 recursion: 5, //recursion level, 1 to disable
 too_short: 1, //length of a word to short to be linked on uniqueness
 small_region: 9, //length (in words/chars) of a region where such a word is considered as long enough
 min_moved_length: 10, //minimal length for a block to be considered as moved
 
 indicate_moves: 1, //0: do not show moves, 1: show moved text at new position, 2: show moved text at both positions
 
 show_par: '¶', //show this sign for deleted/inserted new lines that can't be noticed otherwise
 invisible: { //map 'invisible char': 'replacement'
  '\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F': true, //set to <span title="U+xxxx">▯</span>
  '\u0009': '<span title="TAB">\u00A0→\u00A0</span>',
  '\u00A0': '<span title="NBSP">\u00A0</span>',
  '\u00AD': '<span title="SHY">▯</span>',
  '\u034F': '<span title="CGJ">▯</span>',
  '\u1680': '<span title="OGHAM SPACE MARK">\u1680</span>',
  '\u180E': '<span title="MONGOLIAN VOWEL SEPARATOR">\u180E</span>',
  '\u2000': '<span title="EN QUAD">\u2000</span>',
  '\u2001': '<span title="EM QUAD">\u2001</span>',
  '\u2002': '<span title="EN SPACE">\u2002</span>',
  '\u2003': '<span title="EM SPACE">\u2003</span>',
  '\u2004': '<span title="THREE-PER-EM SPACE">\u2004</span>',
  '\u2005': '<span title="FOUR-PER-EM SPACE">\u2005</span>',
  '\u2006': '<span title="SIX-PER-EM SPACE">\u2006</span>',
  '\u2007': '<span title="FIGURE SPACE">\u2007</span>',
  '\u2008': '<span title="PUNCTUATION SPACE">\u2008</span>',
  '\u2009': '<span title="THIN SPACE">\u2009</span>',
  '\u200A': '<span title="HAIR SPACE">\u200A</span>',
  '\u200B': '<span title="ZWSP">▯</span>',
  '\u200C': '<span title="ZWNJ">▯</span>',
  '\u200D': '<span title="ZWJ">▯</span>',
  '\u200E': '\u200E<span title="LRM">▯</span>\u200E',
  '\u200F': '\u200F<span title="RLM">▯</span>\u200F',
  '\u2010': '<span title="HYPHEN">\u2010</span>',
  '\u2011': '<span title="NON-BREAKING HYPHEN">\u2011</span>',
  '\u2012': '<span title="FIGURE DASH">\u2012</span>',
  '\u2013': '<span title="EN DASH">\u2013</span>',
  '\u2014': '<span title="EM DASH">\u2014</span>',
  '\u2015': '<span title="HORIZONTAL BAR">\u2015</span>',
  '\u2028': '<span title="LINE SEPARATOR">▯</span>',
  '\u2029': '<span title="PARAGRAPH SEPARATOR">▯</span>',
  '\u202A': '\u202A<span title="LRE">▯</span>',
  '\u202B': '\u202B<span title="RLE">▯</span>',
  '\u202C': '<span title="PDF">▯</span>\u202C',
  '\u202D': '\u202D<span title="LRO">▯</span>',
  '\u202E': '\u202E<span title="RLO">▯</span>',
  '\u202F': '<span title="NNBSP">\u202F</span>',
  '\u205F': '<span title="MMSP">\u205F</span>',
  '\u2060': '<span title="WJ">▯</span>',
  '\u2061': '<span title="FUNCTION APPLICATION">▯</span>',
  '\u2062': '<span title="INVISIBLE TIMES">▯</span>',
  '\u2063': '<span title="INVISIBLE SEPARATOR">▯</span>',
  '\u2064': '<span title="INVISIBLE PLUS">▯</span>',
  '\u206A': '<span title="INHIBIT SYMMETRIC SWAPPING">▯</span>',
  '\u206B': '<span title="ACTIVATE SYMMETRIC SWAPPING">▯</span>',
  '\u206C': '<span title="INHIBIT ARABIC FORM SHAPING">▯</span>',
  '\u206D': '<span title="ACTIVATE ARABIC FORM SHAPING">▯</span>',
  '\u206E': '<span title="NATIONAL DIGIT SHAPES">▯</span>',
  '\u206F': '<span title="NOMINAL DIGIT SHAPES">▯</span>',
  '\u2212': '<span title="MINUS SIGN">\u2212</span>',
  '\u3000': '<span title="IDEOGRAPHIC SPACE">\u3000</span>',
  '\uFEFF': '<span title="BOM">▯</span>',
  '\uFFF9': '<span title="IAA">\uFFF9</span>',
  '\uFFFA': '<span title="IAS">\uFFFA</span>',
  '\uFFFB': '<span title="IAT">\uFFFB</span>'
 },
 length_omit: 100, //length that an equal block must reach to be considered as too long to be shown entirely
 length_omit_par: 20, //minimal number of characters shown before/after a paragraph next to an omited block
 length_omit_space: 40, //same, but for break next to space
 length_omit_other: 50, //same, but for break inside a (probably very long) word
 length_omit_join: 20 //minimal number of characters that must be omitted, otherwise blocks are joined again
},
 
css: {
 equal: '',
 omit: '',
 ins: 'text-decoration: none; color: #fff; background-color: #009933;',
 del: 'text-decoration: none; color: #fff; background-color: #990033;',
 moved_del: 'text-decoration: none; color: #000; background-color: #ff8060;',
 moved_ins: 'text-decoration: none; color: #000; background-color: #a0ff99;',
 moved_from: 'color: #000; text-decoration: none; font-weight: bold;',
 moved_to: '#d0d0d0', //background-color
 moved_target: 'border: 1px dashed;',
 blocks: [['#000', '#ffff80'], //color, background-color
          ['#000', '#c0ffff'],
          ['#000', '#ffc0e0'],
          ['#000', '#a0ffa0'],
          ['#000', '#ffd0a0'],
          ['#000', '#ffa0a0'],
          ['#000', '#a0a0ff'],
          ['#000', '#ffbbbb'],
          ['#000', '#c0ffa0'],
          ['#000', '#d8ffa0'],
          ['#000', '#b0a0d0']]
},
 
getCSS: function () {
  var css, i;
  css = '.enhanced-diff-equal {' + schnark_diff.css.equal + '}';
  css += '.enhanced-diff-omit {' + schnark_diff.css.omit + '}';
  css += 'ins.enhanced-diff-ins {' + schnark_diff.css.ins + '}';
  css += 'del.enhanced-diff-del {' + schnark_diff.css.del + '}';
  css += 'del.enhanced-diff-moved-del {' + schnark_diff.css.moved_del + '}';
  css += 'ins.enhanced-diff-moved-ins {' + schnark_diff.css.moved_ins + '}';
  css += 'a.enhanced-diff-moved-from, a.enhanced-diff-moved-from:visited, a.enhanced-diff-moved-from:hover {' + schnark_diff.css.moved_from + '}';
  css += '.enhanced-diff-moved-to, .enhanced-diff-moved-to .enhanced-diff-equal {background-color:' + schnark_diff.css.moved_to + ';}';
  css += '.enhanced-diff-moved-to ins, .enhanced-diff-moved-to del {border: 3px solid ' + schnark_diff.css.moved_to + '; border-left: none; border-right: none;}';
  css += 'span.enhanced-diff-moved-to:target {' + schnark_diff.css.moved_target + '}';
  for (i = 0; i < schnark_diff.css.blocks.length; i++) {
      css += '.enhanced-diff-block-' + i + ',' +
             '.enhanced-diff-block-' + i + ' .enhanced-diff-equal {color:' + schnark_diff.css.blocks[i][0] + ';background-color:' + schnark_diff.css.blocks[i][1] + ';}';
      css += '.enhanced-diff-block-' + i + ' ins, .enhanced-diff-block-' + i + ' del {border-color:' + schnark_diff.css.blocks[i][1] + ';}';
  }
  return css;
},
 
invisibleRE: null,
 
//find longest increasing subsequence (FIXME very simple, not efficient algorithm)
lis: function (seq_in) {
   var seq_out = [], endings = [], depths = [], depth, i, j;
   for (i = 0; i < seq_in.length; i++)
       if (endings.length === 0 || seq_in[i] > endings[endings.length - 1]) {
          endings.push(seq_in[i]);
          depths.push(endings.length - 1);
       } else {
          forj: for (j = 0; j < endings.length; j++)
                if (seq_in[i] < endings[j]) {
                   endings[j] = seq_in[i];
                   depths.push(j);
                   break forj;
                }
       }
   depth = endings.length - 1;
   for (i = depths.length; i >= 0; i--)
       if (depths[i] === depth) {
          seq_out.unshift(seq_in[i]);
          depth--;
       }
   return seq_out;
},
 
//find common prefix/suffix
common_prefix: function (one, two) {
      var prefix = '';
      while (one !== '' && two !== '' && one.charAt(0) === two.charAt(0)) {
            prefix += one.charAt(0);
            one = one.substr(1);
            two = two.substr(1);
      }
      return prefix;
},
common_suffix: function (one, two) {
      var suffix = '';
      while (one !== '' && two !== '' && one.charAt(one.length - 1) === two.charAt(two.length - 1)) {
            suffix = one.charAt(one.length - 1) + suffix;
            one = one.substr(0, one.length - 1);
            two = two.substr(0, two.length - 1);
      }
      return suffix;
},
 
//split text into words
mode_cache: {},
split: function (text) {
   var ret = [],
       l = text.length,
       last_word = '',
       mode,
       last_mode = -1, //-1: no letter, 0: number, 1: latin, 2: greek, 3: cyrillic, 4: other alphabets
       get_mode = function (charcode) {
          if (charcode >= 97 && charcode <= 122) return 1; //a-z
          if (charcode >= 65 && charcode <= 90) return 1; //A-Z
          if (charcode >= 48 && charcode <= 57) return 0; //0-9
          if (charcode <= 191 || charcode === 215 || charcode === 247) return -1; //stuff
          if (charcode <= 591) return 1; //latin extended
          if (charcode <= 879) return -1; //stuff
          if (/*charcode >= 880 && */charcode <= 1023) return 2; //greek
          if (/*charcode >= 1024 && */charcode <= 1327) return 3; //cyrillic
          if (charcode >= 7936 && charcode <= 8191) return 2; //greek extended
          if (/*charcode >= 1828 && */charcode <= 7615) return 4; //other alphabets
          if (charcode >= 7680 && charcode <= 7935) return 1;
          if (charcode >= 11360 && charcode <= 11391) return 1;
          if (charcode >= 42784 && charcode <= 43007) return 1;
          if (charcode >= 11264 && charcode <= 55215) return 4; //other alphabets
          if (charcode >= 63744 && charcode <= 65519) return 4;
          return -1;
       };
   for (var i = 0; i < l; i++) {
         var charcode = text.charCodeAt(i);
         if (charcode in schnark_diff.mode_cache) {
            mode = schnark_diff.mode_cache[charcode];
         } else {
            mode = get_mode(charcode);
            schnark_diff.mode_cache[charcode] = mode;
         }
         if (mode === -1) {
            if (last_word !== '') {
               ret.push(last_word);
               last_word = '';
            }
            ret.push(text.charAt(i));
         } else if (mode !== last_mode) {
            if (last_word !== '') ret.push(last_word);
            last_word = text.charAt(i);
         } else {
            last_word += text.charAt(i);
         }
         last_mode = mode;
   }
   if (last_word !== '') ret.push(last_word);
   return ret;
},
 
connect: function (old_words, new_words, o_to_n, n_to_o, old_start, old_end, new_start, new_end, recursion) {
   if (old_start === undefined) old_start = 0;
   if (old_end === undefined) old_end = old_words.length - 1;
   if (new_start === undefined) new_start = 0;
   if (new_end === undefined) new_end = new_words.length - 1;
   if (recursion === undefined) recursion = schnark_diff.config.recursion;
   if (recursion === 0) return;
   var small_region = ((old_end - old_start <= schnark_diff.config.small_region) && (new_end - new_start <= schnark_diff.config.small_region));
 
   function parse_words(words, from, to, conn, which, all_words) { //FIXME bottleneck
      fori: for (var i = from; i <= to; i++) {
          if (conn[i] !== -1) continue; //already connected
          var wicca0 = words[i].charCodeAt(0);
          if (wicca0 === 32 || wicca0 === 13) continue; //only whitespace
          var texts = ['w',  words[i]], //text = texts.join(''); append w everywhere, FF doesn't like __proto__, there may be more of these
              textlength = words[i].length; //textlength = text.length - 1;
          if (!small_region) {
             var j = i + 1;
             while (textlength <= schnark_diff.config.too_short) {
                   if (j > to || conn[j] !== -1) continue fori;
                   var wjcca0 = words[j].charCodeAt(0);
                   if (wjcca0 === 32 || wjcca0 === 13) continue fori; //only whitespace
                   texts.push(words[j]);
                   textlength += words[j].length;
                   j++;
             }
          }
          var text = texts.join('');
          if (which === 'new' && all_words[text] === undefined) continue; //not in old text
          if (all_words[text] === undefined) {
             all_words[text] = {old_count: 1, old_pos: i, new_count: 0, new_pos: -1};
          } else {
             var count = all_words[text][which + '_count'];
             if (count === 0) all_words[text][which + '_pos'] = i;
             all_words[text][which + '_count']++;
          }
       }
   }
 
   var all_words = {}, i;
   parse_words(old_words, old_start, old_end, o_to_n, 'old', all_words);
   parse_words(new_words, new_start, new_end, n_to_o, 'new', all_words);
   if ($.isEmptyObject(all_words)) return;
 
//connect unique words
   for (var word in all_words)
       if (all_words[word].old_count === 1 && all_words[word].new_count === 1) {
          o_to_n[all_words[word].old_pos] = all_words[word].new_pos;
          n_to_o[all_words[word].new_pos] = all_words[word].old_pos;
       }
 
//connect neighbours
   if (o_to_n[old_start] === -1 && n_to_o[new_start] === -1 && old_words[old_start] === new_words[new_start]) {
          o_to_n[old_start] = new_start; n_to_o[new_start] = old_start;
   }
   for (i = old_start; i < old_end; i++) //connect to right until linebreak
       if (o_to_n[i] !== -1 && //connected
           o_to_n[i + 1] === -1 && //neighbour not connected
           old_words[i].indexOf('\n') === -1 && //no newline
           n_to_o[o_to_n[i] + 1] === -1 && //not connected
           old_words[i + 1] === new_words[o_to_n[i] + 1]) { //equal words
               o_to_n[i + 1] = o_to_n[i] + 1;
               n_to_o[o_to_n[i] + 1] = i + 1;
       }
   if (o_to_n[old_end] === -1 && n_to_o[new_end] === -1 &&
       old_words[old_end] === new_words[new_end]) {
      o_to_n[old_end] = new_end;
      n_to_o[new_end] = old_end;
   }
   for (i = old_end; i > old_start; i--) //connect to left
       if (o_to_n[i] !== -1 && //connected
           o_to_n[i - 1] === -1 && //neighbour not connected
           n_to_o[o_to_n[i] - 1] === -1 && //not connected
           old_words[i - 1] === new_words[o_to_n[i] - 1]) { //equal words
               o_to_n[i - 1] = o_to_n[i] - 1;
               n_to_o[o_to_n[i] - 1] = i - 1;
       }
   for (i = old_start; i < old_end; i++) //connect to right
       if (o_to_n[i] !== -1 && //connected
           o_to_n[i + 1] === -1 && //neighbour not connected
           n_to_o[o_to_n[i] + 1] === -1 && //not connected
           old_words[i + 1] === new_words[o_to_n[i] + 1]) { //equal words
               o_to_n[i + 1] = o_to_n[i] + 1;
               n_to_o[o_to_n[i] + 1] = i + 1;
       }
 
//resolve islands recursively
   var look_for_start = true,
       next_old_start, next_old_end, next_new_start, next_new_end;
   fori: for (i = old_start; i <= old_end; i++) {
       if (look_for_start) {
          if (o_to_n[i] === -1) { //this could be the next old_start
             next_old_start = i;
             look_for_start = false;
          }
       } else {
          if (o_to_n[i] !== -1) {
             next_old_end = i - 1;
             look_for_start = true;
             //now we have an unresolved island from next_old_start to next_old_end
             if (next_old_start + 2 >= next_old_end) continue; //too short to be resolvable
             if (next_old_start === old_start) next_new_start = new_start; else next_new_start = o_to_n[next_old_start - 1] + 1;
             if (next_old_end === old_end) next_new_end = new_end; else next_new_end = o_to_n[next_old_end + 1] - 1;
             if (next_new_start + 2 >= next_new_end) continue;
             for (var j = next_new_start; j <= next_new_end; j++)
                 if (n_to_o[j] !== -1) continue fori;
             //now we have a coresponding island from next_new_start to next_new_end
             schnark_diff.connect(old_words, new_words, o_to_n, n_to_o, next_old_start, next_old_end, next_new_start, next_new_end, recursion - 1);
          }
       }
   }
 
   return;
},
get_old_blocks: function (o_to_n) {
   var ret = [],
       last = -1, new_block = true,
       i;
   for (i = 0; i < o_to_n.length; i++)
       if (o_to_n[i] === -1) {
          new_block = true;
          ret.push(-1);
       } else {
          if (!new_block && o_to_n[i - 1] + 1 !== o_to_n[i]) new_block = true;
          if (new_block) { new_block = false; last++; }
          ret.push(last);
       }
   return ret;
},
get_new_blocks: function (n_to_o, old_blocks) {
   var ret = [], i;
   for (i = 0; i < n_to_o.length; i++)
       if (n_to_o[i] === -1) {
          ret.push(-1);
       } else {
          ret.push(old_blocks[n_to_o[i]]);
       }
   return ret;
},
get_block_seqence: function (new_blocks, new_words) {
   var ret = [],
       last_block = -1, last_length = -1, i, j, this_length;
   for (i = 0; i < new_blocks.length; i++)
       if (new_blocks[i] !== -1 && new_blocks[i] !== last_block) { //a new block
          if (new_blocks[i] === last_block - 1) { //falling seqence -> only keep longest block (so not to move a long block round a shorter)
             if (last_length === -1) { //calculate length
                j = i - 1; while (new_blocks[j] === -1) j--;
                last_length = 0; while (new_blocks[j--] === last_block) last_length += new_words[j + 1].length;
             }
             this_length = 0; //calculate new length
             last_block = new_blocks[i];
             j = i; while (new_blocks[j++] === last_block) this_length += new_words[j - 1].length;
             if (this_length > last_length) { //exchange
                ret[ret.length - 1] = last_block;
                last_length = this_length;
             }
          } else {
             last_block = new_blocks[i];
             last_length = -1;
             ret.push(last_block);
          }
       }
   return ret;
},
 
raw_diff: function (block_seq, old_blocks, new_blocks, old_words, new_words, no_moves) {
   var ret = [],
       action = '', text = '';
   function out (t, a) {
       if (action !== a) {
          if ((no_moves || text.length < schnark_diff.config.min_moved_length) && (action.charAt(0) === '.' || action.charAt(0) === ':')) //too short for a move
             action = (action.charAt(0) === '.') ? '+' : '-';
          if (ret.length > 0 && ret[ret.length - 1][1] === action) {
             ret[ret.length - 1][0] += text;
          } else if (action !== '') {
             ret.push([text, action.charAt(0)]);
          }
          action = a; text = t;
       } else {
          text += t;
       }
   }
   var i_old = 0, i_new = 0,
       common_block; //next common block number
 
   while (i_old < old_blocks.length || i_new < new_blocks.length) {
         if (block_seq.length === 0) common_block = -2; else common_block = block_seq[0];
         while (i_old < old_blocks.length && old_blocks[i_old] !== common_block) {
               out(old_words[i_old], (old_blocks[i_old] === -1) ? '-' : ':' + old_blocks[i_old]);
               i_old++;
         }
         while (i_new < new_blocks.length && new_blocks[i_new] !== common_block) {
               out(new_words[i_new], (new_blocks[i_new] === -1) ? '+' : '.' + new_blocks[i_new]);
               i_new++;
         }
         while (i_old < old_blocks.length && old_blocks[i_old] === common_block) {
               out(old_words[i_old], '=');
               i_old++; i_new++;
         }
         if (block_seq.length > 0) block_seq.shift();
   }
 
   out('', '');
   return ret;
},
 
move_numbers: function (diff) {
   var next_number = 0, conn = {}, i;
   for (i = 0; i < diff.length; i++) {
       var text = diff[i][0],
           action = diff[i][1];
       if (action === '.' || action === ':') {
          if (!(text in conn)) {
             conn[text] = next_number++;
          }
          diff[i] = [text, action, conn[text]];
       }
   }
   return diff;
},
 
nested_diff: function (diff) {
   function getDot(n) {
      for (var i = 0; i < diff.length; i++) {
          if (diff[i][1] === '.' && diff[i][2] === n) {
             return i;
          }
      }
   }
 
   var i = 0, j, k, freeNumbers = {};
   while (i < diff.length) {
         if (diff[i][1] === ':') {
            var beginColon = i, beginDot = getDot(diff[i][2]), endColon = beginColon, endDot = beginDot, foundEnd = false;
            while (!foundEnd) {
                  j = endColon + 1;
                  k = endDot + 1;
                  if (j < diff.length && diff[j][1] === '-') {
                     j++;
                  }
                  if (k < diff.length && diff[k][1] === '+') {
                     k++;
                  }
                  if (j < diff.length && k < diff.length && diff[j][1] === ':' && diff[k][1] === '.' && diff[j][2] === diff[k][2]) {
                     endColon = j;
                     endDot = k;
                  } else {
                     foundEnd = true;
                  }
            }
 
            if (endColon > beginColon) {
               var colons = diff[beginColon][0];
               for (j = beginColon + 1; j <= endColon; j++) {
                   if (diff[j][1] === ':') {
                      colons += diff[j][0];
                      freeNumbers[diff[j][2]] = true;
                   }
               }
               var dots = [];
               j = beginColon;
               for (k = beginDot; k < endDot; k++) {
                   if (diff[k][1] === '.') {
                      dots.push([diff[k][0], '=']);
                      j++;
                      if (diff[j][1] === '-') {
                         dots.push([diff[j][0], '-']);
                         j++;
                      }
                   } else { //if diff[k][1] === '+'
                      dots.push([diff[k][0], '+']);
                   }
               }
               dots[0][1] = '<';
               dots[0][2] = diff[beginColon][2];
               dots.push([diff[endDot][0], '>']);
               diff.splice(beginColon, endColon - beginColon + 1, [colons, ':', dots[0][2]]);
               if (beginColon < beginDot) {
                  beginDot -= endColon - beginColon;
                  endDot -= endColon - beginColon;
               }
               dots.unshift(beginDot, endDot - beginDot + 1);
               diff.splice.apply(diff, dots);
               if (beginDot < i) {
                  i -= endDot - beginDot;
               }
            }
         }
         i++;
   }
   for (i = 0; i < diff.length; i++) {
       if (diff[i][1] === ':' || diff[i][1] === '.' || diff[i][1] === '<') {
          var old = diff[i][2];
          for (j in freeNumbers) {
              if (j < old) {
                 diff[i][2]--;
              }
          }
       }
   }
   return diff;
},
 
strength_cache: {},
clean_breaks: function (diff) {
   var strength_ = function (char) { //how strong a character divedes a text
          if (char === '') return 10;
          if (char === '\n') return 9;
          if ('[{|}]'.indexOf(char) > -1) return 8;
          if ('!().:;<>?¡¿–'.indexOf(char) > -1) return 7;
          if (',/\\'.indexOf(char) > -1) return 6;
          if ('"\'«»‘’‚‛“”„‟'.indexOf(char) > -1) return 5;
          if (char === ' ') return 4;
          if (char.search(/[\u0009\u00A0\u2000-\u200B\u2028\u2029\u202F\u205F-\u2061\u2063\u3000\uFEFF]/) > -1) return 3;
          if ('#&*+-_±'.indexOf(char) > -1) return 2;
          if (char.search(/[0-9\u0041-\u005A\u0061-\u007A\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u1FFF\u2C00-\uD7FF\uF900-\uFE1F\uFE30-\uFFEF]/) > -1) return 0;
          return 1;
       },
       strength = function (char) {
          if (char in schnark_diff.strength_cache) return schnark_diff.strength_cache[char];
          var str = strength_(char);
          schnark_diff.strength_cache[char] = str;
          return str;
       };
   function shiftcount (index) { //calculate the characters to shift
            if (index === 0 || index === diff.length - 1 ||
                diff[index - 1][1] !== '=' || diff[index + 1][1] !== '=' ||
                '-+.:'.indexOf(diff[index][1]) === -1)
               return 0;
 
            var equality1 = diff[index - 1][0],
                edit = diff[index][0],
                equality2 = diff[index + 1][0];
            //shift as far left as possible
            var suffix = schnark_diff.common_suffix(equality1, edit);
            equality1 = equality1.substr(0, equality1.length - suffix.length);
            edit = suffix + edit.substr(0, edit.length - suffix.length);
            equality2 = suffix + equality2;
 
            //go right
            var pos = -suffix.length;
            var best_pos = pos;
            var best_score = strength(equality1.charAt(equality1.length - 1));
            while (edit.charAt(0) === equality2.charAt(0)) {
                  var char = edit.charAt(0);
                  pos++;
                  equality1 += char;
                  edit = edit.substr(1) + char;
                  equality2 = equality2.substr(1);
                  var score = strength(char);
                  if (equality2 === '') score = strength('');
                  if (score >= best_score) {
                     best_score = score;
                     best_pos = pos;
                  }
            }
            return best_pos;
   }
   function doshift (index, count) {
            if (count === 0) return;
            var text = diff[index - 1][0] + diff[index][0] + diff[index + 1][0];
            diff[index - 1][0] = text.substr(0, diff[index - 1][0].length + count);
            diff[index][0] = text.substr(diff[index - 1][0].length, diff[index][0].length);
            diff[index + 1][0] = text.substr(text.length - diff[index + 1][0].length + count);
   }
 
   var moved_count = {};
 
   for (var i = 1; i < diff.length - 1; i++) {
       var count = shiftcount(i);
       if (count === 0) continue;
       var type = diff[i][1];
       if (type === '+' || type === '-') {
          doshift(i, count);
       }
       if (type === '.' || type === ':') {
          if (moved_count[diff[i][2]] !== undefined) {
             var other_count = moved_count[diff[i][2]][1];
             if (other_count * count > 0) { //same direction
                if (0 < count && other_count < count) count = other_count;
                if (0 > count && other_count > count) count = other_count;
                doshift(moved_count[diff[i][2]][0], count);
                doshift(i, count);
             }
          } else {
             moved_count[diff[i][2]] = [i, count];
          }
       }
   }
   return diff;
},
 
char_diff: function (diff) {
   var ret = [], i;
   function push(arr) {
     if (ret.length > 0 && ret[ret.length - 1][1] === arr[1] && '.:<>'.indexOf(arr[1]) === -1) {
        ret[ret.length - 1][0] += arr[0];
     } else {
        ret.push(arr);
     }
   }
 
   for (i = 0; i < diff.length - 1; i++)
       if (diff[i][1] === '-' && diff[i + 1][1] === '+') {
          var text_del = diff[i][0], text_ins = diff[i + 1][0];
 
          //simple cases
          var pos;
          if (text_del.indexOf(text_ins) > -1) {
             pos = text_del.indexOf(text_ins);
             if (pos !== 0) push([text_del.substr(0, pos), '-']);
             push([text_ins, '=']);
             if (pos + text_ins.length !== text_del.length) push([text_del.substr(pos + text_ins.length), '-']);
          } else if (text_ins.indexOf(text_del) > -1) {
             pos = text_ins.indexOf(text_del);
             if (pos !== 0) push([text_ins.substr(0, pos), '+']);
             push([text_del, '=']);
             if (pos + text_del.length !== text_ins.length) push([text_ins.substr(pos + text_del.length), '+']);
          } else {
 
          //diff on character level
          var old_chars = text_del.split(''),
              new_chars = text_ins.split(''),
              j,
              o_to_n = [], n_to_o = [];
          for (j = 0; j < old_chars.length; j++) o_to_n[j] = -1;
          for (j = 0; j < new_chars.length; j++) n_to_o[j] = -1;
          schnark_diff.connect(old_chars, new_chars, o_to_n, n_to_o);
          var old_blocks = schnark_diff.get_old_blocks(o_to_n);
          var new_blocks = schnark_diff.get_new_blocks(n_to_o, old_blocks);
          var block_seq = schnark_diff.get_block_seqence(new_blocks, new_chars);
          block_seq = schnark_diff.lis(block_seq);
          var inner_diff = schnark_diff.raw_diff(block_seq, old_blocks, new_blocks, old_chars, new_chars, true);
          for (j = 0; j < inner_diff.length; j++) push(inner_diff[j]);
 
          }
 
          i++;
       } else {
          push(diff[i]);
       }
   if (i === diff.length - 1) {
      push(diff[diff.length - 1]);
   }
 
   return ret;
},
 
diff: function (o, n, nested) {
   //fix newlines
   o = o.replace(/\r\n?/g, '\n');
   n = n.replace(/\r\n?/g, '\n');
 
   //trivial changes, we do not cancel common pre/suffixes, this doesn't give clean diffs in some circumstances
   if (o === n) return [[o, '=']];
   if (o === '') return [[n, '+']];
   if (n === '') return [[o, '-']];
 
   //split into words
   var old_words = schnark_diff.split(o),
       new_words = schnark_diff.split(n),
       i,
       o_to_n = [], n_to_o = [];
   for (i = 0; i < old_words.length; i++) o_to_n[i] = -1;
   for (i = 0; i < new_words.length; i++) n_to_o[i] = -1;
   //connect
   schnark_diff.connect(old_words, new_words, o_to_n, n_to_o);
   //get block numbers, sequence of blocks
   var old_blocks = schnark_diff.get_old_blocks(o_to_n),
       new_blocks = schnark_diff.get_new_blocks(n_to_o, old_blocks),
       block_seq = schnark_diff.get_block_seqence(new_blocks, new_words);
   //find longest increasing subsequence (unchanged blocks)
   block_seq = schnark_diff.lis(block_seq);
   //get raw diff
   var diff = schnark_diff.raw_diff(block_seq, old_blocks, new_blocks, old_words, new_words);
 
   diff = schnark_diff.move_numbers(diff);
 
   if (nested) {
      diff = schnark_diff.nested_diff(diff);
   }
 
   //clean up
   for (i = 0; i < schnark_diff.config.char_diff; i++) {
       diff = schnark_diff.char_diff(diff);
   }
   diff = schnark_diff.clean_breaks(diff);
 
   return diff;
},
 
html_diff: function (o, n, nested) {
   //get diff
   var diff = schnark_diff.diff(o, n, nested),
       invisible, c;
   if (schnark_diff.invisibleRE === null) {
      invisible = '[';
      for (c in schnark_diff.config.invisible) {
          if (schnark_diff.config.invisible.hasOwnProperty(c)) {
             invisible += c;
          }
      }
      invisible += ']';
      schnark_diff.invisibleRE = new RegExp(invisible, 'g');
   }
   invisible = schnark_diff.invisibleRE;
 
   function hex (c) {
     return (c.charCodeAt(0) + 0x10000).toString(16).toUpperCase().substr(1);
   }
 
   function esc (text, nl, inv) {
            if (nl) {
               text = text.replace(/^\n/, schnark_diff.config.show_par + '\n')
                          .replace(/\n\n$/, '\n' + schnark_diff.config.show_par + '\n');
            }
            text = mw.html.escape(text);
            if (inv) {
               text = text.replace(invisible, function (c) {
                           return schnark_diff.config.invisible[c] || '<span title="U+' + hex(c) + '">▯</span>';
                      });
            }
            return text.replace(/^ /, '&nbsp;').replace(/\n /g, '<br />&nbsp;').replace(/ {2}/g, ' &nbsp;').replace(/\n/g, '<br />');
   }
 
   var out = [], i;
   for (i = 0; i < diff.length; i++) {
       var d = diff[i],
           text = d[0], action = d[1], block = d[2];
       if (text === '') continue;
 
       if (action === ':' && schnark_diff.config.indicate_moves === 1) {
          text = esc(text.replace(/\n/g, '').substr(0, 10) + '…', false, false);
       } else if (action === '=') {
          if (text.length >= schnark_diff.config.length_omit) {
             var first = text.indexOf('\n', schnark_diff.config.length_omit_par);
             if (first === -1) first = text.indexOf(' ', schnark_diff.config.length_omit_space);
             if (first === -1) first = schnark_diff.config.length_omit_other;
             var last = text.lastIndexOf('\n', text.length - schnark_diff.config.length_omit_par);
             if (last === -1) last = text.lastIndexOf(' ', text.length - schnark_diff.config.length_omit_space);
             if (last === -1) last = text.length - schnark_diff.config.length_omit_other;
             if (first + schnark_diff.config.length_omit_join < last) {
                if (i === 0) first = -1;
                if (i === diff.length - 1) last = text.length;
                text = esc(text.substr(0, first + 1), false, false) + '<span class="enhanced-diff-omit">…</span>' + esc(text.substr(last), false, false);
             } else {
                text = esc(text, false, false);
             }
          } else {
             text = esc(text, false, false);
          }
       } else {
          text = esc(text, true, true);
       }
       switch (action) {
       case '=': out.push('<span class="enhanced-diff-equal">' + text + '</span>'); break;
       case '+': out.push('<ins class="enhanced-diff-ins">' + text + '</ins>'); break;
       case '-': out.push('<del class="enhanced-diff-del">' + text + '</del>'); break;
       case ':': if (schnark_diff.config.indicate_moves === 1) {
                    out.push('<a class="enhanced-diff-moved-from enhanced-diff-block-' + block + '" href="#moved-block-' + block + '" title="' + text + '">^</a>');
                 } else if (schnark_diff.config.indicate_moves === 0) {
                    out.push('<del class="enhanced-diff-del">' + text + '</del>');
                 } else {
                    out.push('<del class="enhanced-diff-moved-del">' + text + '</del>');
                 } break;
       case '.': if (schnark_diff.config.indicate_moves === 1) {
                    out.push('<span class="enhanced-diff-moved-to enhanced-diff-block-' + block + '" id="moved-block-' + block + '">' + text + '</span>');
                 } else if (schnark_diff.config.indicate_moves === 0) {
                    out.push('<ins class="enhanced-diff-ins">' + text + '</ins>');
                 } else {
                    out.push('<ins class="enhanced-diff-moved-ins">' + text + '</ins>');
                 } break;
       case '<': out.push('<span class="enhanced-diff-moved-to enhanced-diff-block-' + block + '" id="moved-block-' + block + '">' + text); break;
       case '>': out.push(text + '</span>'); break;
       }
   }
   return out.join('');
},
 
clear_caches: function () {
   schnark_diff.mode_cache = {};
   schnark_diff.strength_cache = {};
}
};
 
window.schnark_diff = schnark_diff; //legacy
//libs.schnark_diff = schnark_diff;
$(document).trigger('loadWikiScript', ['Benutzer:Schnark/js/diff.js/core.js', schnark_diff]);
 
})(jQuery, mw.libs);
//})(jQuery);
//</nowiki>
