"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IndividualName = void 0;
var debug_1 = require("@shared/debug");
var DEBUG = (0, debug_1.default)(new URL(import.meta.url).pathname);
if (DEBUG) {
  console.log("DEBUG enabled for ".concat(new URL(import.meta.url).pathname));
}
var gedcom_1 = require("@hp-stuff/schemas/gedcom");
// Class for handling individual names consistently
var IndividualName = /** @class */ (function () {
  function IndividualName(person) {
    var _this = this;
    this.lastName = function () {
      var name = "";
      if (Array.isArray(_this.person.primary_name.surname_list)) {
        var found_1 = false;
        _this.person.primary_name.surname_list.map(function (sn) {
          if (sn.primary) {
            if (
              !sn.origintype.string.localeCompare(
                gedcom_1.PersonStrings.Values.Taken
              )
            ) {
              found_1 = true;
              var prefix = !sn.prefix.localeCompare("of") ? "of " : sn.prefix;
              name = "".concat(name).concat(prefix).concat(sn.surname);
              if (DEBUG) {
                console.log(
                  "found lastname "
                    .concat(sn.surname, " for ")
                    .concat(_this.grampsId, ", name now ")
                    .concat(name)
                );
              }
            }
          }
        });
        /* eslint-disable-next-line @typescript-eslint/no-unnecessary-condition */
        if (!found_1 && _this.person.primary_name.surname_list.length > 0) {
          var prefix = _this.person.primary_name.surname_list[0].prefix;
          prefix = !prefix.localeCompare("of") ? "of " : prefix;
          var sn = _this.person.primary_name.surname_list[0].surname;
          name = "".concat(name).concat(prefix).concat(sn);
          if (DEBUG) {
            console.log(
              "found lastname "
                .concat(sn, " for ")
                .concat(_this.grampsId, ", name now ")
                .concat(name)
            );
          }
        }
      }
      return name.length ? name : "Unknown";
    };
    this.firstName = function (suffix) {
      if (suffix === void 0) {
        suffix = true;
      }
      var name = "";
      if (_this.person.primary_name.first_name.length > 0) {
        name += _this.person.primary_name.first_name;
      } else if (
        _this.person.primary_name.nick &&
        _this.person.primary_name.nick.length > 0
      ) {
        name += _this.person.primary_name.nick;
      } else if (
        _this.person.primary_name.call &&
        _this.person.primary_name.call.length
      ) {
        name += _this.person.primary_name.call;
      } else {
        name += "Unknown";
      }
      return name;
    };
    this.suffix = function () {
      if (
        _this.person.primary_name.suffix &&
        _this.person.primary_name.suffix.length > 0
      ) {
        var suffix = _this.person.primary_name.suffix;
        var lastName = _this.lastName();
        var prefix = "";
        for (
          var _i = 0, _a = _this.person.primary_name.surname_list;
          _i < _a.length;
          _i++
        ) {
          var sno = _a[_i];
          var sn = sno.surname;
          if (!sn.localeCompare(lastName)) {
            prefix = sno.prefix.toString();
          }
        }
        if (prefix.length) {
          return "".concat(prefix, " ").concat(suffix);
        } else {
          return suffix;
        }
      }
      return "";
    };
    this.displayName = function () {
      var name = "";
      name = _this.firstName(false);
      var sn = _this.lastName();
      if (sn.length) {
        name += " ".concat(sn);
      }
      if (
        _this.person.primary_name.suffix &&
        _this.person.primary_name.suffix.length > 0
      ) {
        var suffix = _this.suffix();
        name = "".concat(name).concat(suffix.length ? " ".concat(suffix) : "");
      }
      return name;
    };
    this.getIconName = function () {
      return _this.person.gender === 1
        ? "ion-male"
        : _this.person.gender === 0
          ? "ion-female"
          : "tdesign:user-unknown";
    };
    this.getIconClass = function () {
      return _this.person.gender === 1
        ? "color-male"
        : _this.person.gender === 0
          ? "color-female"
          : "icon1";
    };
    this.person = person;
    this.grampsId = person.gramps_id;
  }
  // Get full name for display
  IndividualName.prototype.getFullName = function () {
    var suffix = this.suffix();
    return ""
      .concat(this.firstName(), " ")
      .concat(this.lastName())
      .concat(suffix.length ? " ".concat(suffix) : "");
  };
  // Get filename for markdown file
  IndividualName.prototype.getFilename = function () {
    var lastname = this.lastName();
    var firstName = this.firstName();
    var suffix = this.suffix();
    if (lastname === "Unknown" && firstName === "Unknown") {
      return "Unknown/".concat(this.grampsId, ".md");
    } else if (lastname === "Unknown") {
      return "Unknown/".concat(firstName, " - ").concat(this.grampsId, ".md");
    } else if (firstName === "Unknown") {
      return "".concat(lastname, "/").concat(this.grampsId, ".md");
    } else {
      return ""
        .concat(lastname, "/")
        .concat(firstName)
        .concat(suffix.length ? " ".concat(suffix) : "", ".md");
    }
  };
  // Format URL for markdown links
  IndividualName.prototype.formatUrlForMarkdown = function (base) {
    if (base === void 0) {
      base = "";
    }
    // Remove .md extension for URLs
    var url = this.getFilename().replace(".md", "");
    if (url.includes(" ")) {
      return "</".concat(base).concat(url, "/>");
    } else return "/".concat(base).concat(url, "/");
  };
  return IndividualName;
})();
exports.IndividualName = IndividualName;
