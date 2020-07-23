import Fragment from "./Fragment";

export default class FragmentChain {
    public fragment: Fragment;
    public children: FragmentChain[];

    constructor(fragment: Fragment, children: FragmentChain[]) {
        this.fragment = fragment;
        this.children = children;
    }
}
