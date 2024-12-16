/*!
 * Copyright 2024 Adobe. All rights reserved.
 *
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at <http://www.apache.org/licenses/LICENSE-2.0>
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

/* edited to remove all the dynamic logic from the original Adobe file */

export default {
  plugins: {
    /* --------------------------------------------------- */
    /* ------------------- IMPORTS ---------------- */
    /** @link https://github.com/postcss/postcss-import#postcss-import */
    "postcss-import": {},
    /* --------------------------------------------------- */
    /* ------------------- SASS-LIKE UTILITIES ----------- */
    "postcss-extend": {},
    "postcss-hover-media-feature": {},
    "postcss-pseudo-classes": {
      restrictTo: [
        "focus-visible",
        "focus-within",
        "hover",
        "active",
        "disabled",
      ],
      allCombinations: true,
      preserveBeforeAfter: false,
      prefix: "is-",
    },
    autoprefixer: {},
  },
};
