import { Router } from "../../src/Router";
import { RouterLink } from "../../src/RouterLink";

declare const expect: Chai.ExpectStatic;

const a = (href: string) => {
	const el = document.createElement("a");
	el.href = href;
	return el;
};

const div = () => document.createElement("div");
const connect = (element: HTMLElement) => document.body.appendChild(element);

const setup = async () => {
	const router = new Router({
		root: "/",
		routes: [],
	});
	if (customElements.get("router-link") === undefined) {
		customElements.define("router-link", RouterLink);
	}
	RouterLink.use(router);
	await router.connect(div());
	await router.push("/");
	return router;
};

const nextAnimationFrame = (): Promise<void> => {
	return new Promise((resolve) => {
		window.requestAnimationFrame(() => resolve());
	});
};

describe("RouterLink", () => {
	it("applies active attribute when it matches", async () => {
		const router = await setup();
		const link = new RouterLink();
		link.appendChild(a("/abc"));
		connect(link);

		expect(link.to).to.equal("/abc");
		expect(link.active).to.equal(false);

		await router.push("/abc");

		expect(link.active).to.equal(true);
		router.disconnect();
	});

	it("clicking the link triggers navigation", async () => {
		const router = await setup();
		const link = new RouterLink();
		link.appendChild(a("/abc"));
		connect(link);

		link.click();
		await nextAnimationFrame();

		expect(location.pathname).to.equal("/abc");
		expect(link.active).to.equal(true);
		router.disconnect();
	});

	it("disabling the link prevents navigation", async () => {
		const router = await setup();
		const pathname = location.pathname;

		const link = new RouterLink();
		link.disabled = true;
		link.appendChild(a("/abc"));
		connect(link);

		link.click();
		await nextAnimationFrame();

		expect(location.pathname).to.equal(pathname);
		expect(pathname).to.not.equal("/abc");
		router.disconnect();
	});

	it("intercepts clicks on child anchor", async () => {
		const router = await setup();
		const link = new RouterLink();
		const anchor = a("/abc");
		link.appendChild(anchor);
		connect(link);

		anchor.click();
		await nextAnimationFrame();

		expect(link.active).to.equal(true);
		router.disconnect();
	});

	it("can be configured to match exactly", async () => {
		const router = await setup();
		const link = new RouterLink();
		link.appendChild(a("/abc"));
		link.to = "/abc";
		link.exact = true;
		connect(link);

		await router.push("/abc");
		expect(link.active).to.equal(true);

		await router.push("/abcd");
		expect(link.active).to.equal(false);
		router.disconnect();
	});
});
