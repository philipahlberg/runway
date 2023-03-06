export class StaticComponent extends HTMLElement {
	foo?: string;
}
customElements.define("static-component", StaticComponent);
