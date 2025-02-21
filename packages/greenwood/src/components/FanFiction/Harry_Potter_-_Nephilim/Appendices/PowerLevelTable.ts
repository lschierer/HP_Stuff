import debugFunction from "../../../../lib/debug.ts";
const DEBUG = debugFunction(new URL(import.meta.url).pathname);
if (DEBUG) {
  console.log(`DEBUG enabled for ${new URL(import.meta.url).pathname}`);
}

import SpectrumCSStable from "@spectrum-css/table/dist/index.css" with { type: "css" };

export default class PowerLevelTable extends HTMLElement {
  connectedCallback() {
    this.attachShadow({ mode: "open" });
    if (this.shadowRoot) {
      this.shadowRoot.adoptedStyleSheets.push(SpectrumCSStable);

      this.shadowRoot.innerHTML = `
        <table
          class="spectrum-Table spectrum-Table--sizeM spectrum-Table--quiet "
          id="power-level-table"
          >
          <thead class="spectrum-Table-head">
            <tr>
              <th aria-sort="none" tabindex="0" class="spectrum-Table-headCell">
                <span class="spectrum-Table-columnTitle">
                  Power Level
                </span>
              </th>
              <th aria-sort="none" tabindex="0" class="spectrum-Table-headCell">
                <span class="spectrum-Table-columnTitle">
                  Ability Estimate
                </span>
              </th>
            </tr>
          </thead>
          <tbody class="spectrum-Table-body">

          <tr class="spectrum-Table-row">
            <td class="spectrum-Table-cell">
              1
            </td>

					<td class="spectrum-Table-cell">
					  <strong>all</strong> of the following:
					  <ul>
							<li>
							  some single weak ability within this category
							</li>
							<li>
							  no conscious control
							</li>
						</ul>
					</td>
				</tr>
				<tr class="spectrum-Table-row">

				  <td class="spectrum-Table-cell">
						2
					</td>

					<td class="spectrum-Table-cell">
						<strong>one</strong> of the following:
						<ul>
						  <li>
								multiple barely detectable abilities
							</li>
							<li>
							  conscious control of a single weak ability
							</li>
							<li>
							  single ability of moderate strength without conscious control
							</li>
						</ul>
					</td>
				</tr>
				<tr class="spectrum-Table-row">
				  <td class="spectrum-Table-cell">
						3
					</td>

					<td class="spectrum-Table-cell">
					  <span>able to manipulate this category of magic with great difficulty</span>
					</td>
				</tr>

				<tr class="spectrum-Table-row">
				  <td class="spectrum-Table-cell">
						4
					</td>

					<td class="spectrum-Table-cell">
			      <strong>all</strong> of the following:
			      <ul>
							<li>
							  able to achieve minimally acceptable levels of competence in this category of magic
							</li>
							<li>
							  if some OWL test depended solely on this category of magic, expect to score in the P range.
							</li>
						</ul>
					</td>
				</tr>

				<tr class="spectrum-Table-row">
				  <td class="spectrum-Table-cell">
						5
					</td>

					<td class="spectrum-Table-cell">
			      <strong>all</strong> of the following:
			      <ul>
							<li>
							  expected to achieve acceptable levels of proficiency in this category of magic
							</li>
							<li>
							  if some OWL test depended solely on this category of magic, expect to score in the A range.
							</li>
						</ul>
					</td>
				</tr>

				<tr class="spectrum-Table-row">
				  <td class="spectrum-Table-cell">
						6
					</td>

					<td class="spectrum-Table-cell">
			      <strong>all</strong> of the following:
			      <ul>
							<li>
							  expected to be capable of more advanced learning in this category of magic.
							</li>
							<li>
					      if some OWL test depended solely on this category of magic, expect to score in the E range.
							</li>
							<li>
							  if some NEWT test depended solely on this category of magic, expect to score in the A range.
							</li>
						</ul>
					</td>
				</tr>

				<tr class="spectrum-Table-row">
				  <td class="spectrum-Table-cell">
						7
					</td>

					<td class="spectrum-Table-cell">
			      <strong>all</strong> of the following:
			      <ul>
							<li>
					      expected to be capable of doing well in an advanced course on this category of magic.
							</li>
							<li>
	              if some OWL test depended solely on this category of magic, expect to score in the O range.
							</li>
							<li>
					      if some NEWT test depended solely on this category of magic, expect to score in the E range.
							</li>
							<li>
							  possibly capable of learning magics in this category beyond NEWT level.
							</li>
						</ul>
					</td>
				</tr>

				<tr class="spectrum-Table-row">
				  <td class="spectrum-Table-cell">
						8
					</td>

					<td class="spectrum-Table-cell">
			      <strong>all</strong> of the following:
			      <ul>
							<li>
					      expected to be capable of doing well in an advanced course on this category of magic.
							</li>
							<li>
	              if some OWL test depended solely on this category of magic, expect to score in the O range.
							</li>
							<li>
					      if some NEWT test depended solely on this category of magic, expect to score in the 0 range.
							</li>
							<li>
							  capable of learning magics in this category beyond NEWT level.
							</li>
						</ul>
					</td>
				</tr>

				<tr class="spectrum-Table-row">
				  <td class="spectrum-Table-cell">
						9
					</td>

					<td class="spectrum-Table-cell">
			      <strong>all</strong> of the following:
			      <ul>
							<li>
	              expected to learn OWL and NEWT level magics with relative ease.
							</li>
							<li>
                  expected to learn magics beyond the NEWT level in this category of magic.
							</li>
							<li>
	              instinctual (unconscious) use of magic in this category is extremely common.
							</li>
						</ul>
					</td>
				</tr>

				<tr class="spectrum-Table-row">
				  <td class="spectrum-Table-cell">
						10
					</td>

					<td class="spectrum-Table-cell">
            <strong>all</strong> of the following:
			      <ul>
							<li>
                  learning this category of magic is more about finding out what is possible and fine-tuning abilities you already have.
							</li>
							<li>
							  OWL and NEWT practicals will be easy, but theory portions may be difficult for this person, because their magic is in fact instinctual in this area.
							</li>
						</ul>
					</td>
				</tr>

			</tbody>
		</table>
      `;
    }
  }
}
customElements.define("powerlevel-table", PowerLevelTable);
