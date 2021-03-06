import {
    Component,
    OnInit,
    ChangeDetectionStrategy,
    ViewEncapsulation,
    ElementRef,
    Input,
    HostBinding
} from '@angular/core';

import { UpdateHostClassService } from '../shared';
import { ThyIconRegistry } from './icon-registry';
import { take } from 'rxjs/operators';

@Component({
    selector: 'thy-icon',
    template: '<ng-content></ng-content>',
    changeDetection: ChangeDetectionStrategy.OnPush,
    encapsulation: ViewEncapsulation.None,
    providers: [UpdateHostClassService]
})
export class ThyIconComponent implements OnInit {
    _iconName: string;

    @HostBinding(`class.thy-icon`) addIconClass = true;

    @Input('thyIconName')
    set iconName(value: string) {
        this._iconName = value;
    }
    get iconName() {
        return this._iconName;
    }

    @Input('thyIconSet') iconSet: string;

    @Input('thyTwotoneColor') twotoneColor: string;

    private setSvgElement(svg: SVGElement) {
        this.clearSvgElement();

        // Workaround for IE11 and Edge ignoring `style` tags inside dynamically-created SVGs.
        // See: https://developer.microsoft.com/en-us/microsoft-edge/platform/issues/10898469/
        // Do this before inserting the element into the DOM, in order to avoid a style recalculation.
        const styleTags = svg.querySelectorAll('style') as NodeListOf<HTMLStyleElement>;

        for (let i = 0; i < styleTags.length; i++) {
            styleTags[i].textContent += ' ';
        }

        const allPaths = svg.querySelectorAll('path');
        if (allPaths.length > 1) {
            allPaths.forEach((child, index: number) => {
                if (this.twotoneColor) {
                    if (index === 1) {
                        child.setAttribute('fill', this.twotoneColor);
                    } else {
                        child.setAttribute('fill', 'currentColor');
                    }
                } else {
                    if (index === 1) {
                        child.setAttribute('fill', '#fff');
                    } else {
                        child.setAttribute('fill', 'currentColor');
                    }
                }

                // if (child.getAttribute('fill') === 'secondaryColor') {
                //     child.setAttribute('fill', 'currentColor');
                // } else {
                // }
            });
        }
        // Note: we do this fix here, rather than the icon registry, because the
        // references have to point to the URL at the time that the icon was created.
        // if (this._location) {
        //     const path = this._location.getPathname();
        //     this._previousPath = path;
        //     this._cacheChildrenWithExternalReferences(svg);
        //     this._prependPathToReferences(path);
        // }

        this.elementRef.nativeElement.appendChild(svg);
    }

    private clearSvgElement() {
        const layoutElement: HTMLElement = this.elementRef.nativeElement;
        let childCount = layoutElement.childNodes.length;

        // if (this._elementsWithExternalReferences) {
        //     this._elementsWithExternalReferences.clear();
        // }

        // Remove existing non-element child nodes and SVGs, and add the new SVG element. Note that
        // we can't use innerHTML, because IE will throw if the element has a data binding.
        while (childCount--) {
            const child = layoutElement.childNodes[childCount];

            // 1 corresponds to Node.ELEMENT_NODE. We remove all non-element nodes in order to get rid
            // of any loose text nodes, as well as any SVG elements in order to remove any old icons.
            if (child.nodeType !== 1 || child.nodeName.toLowerCase() === 'svg') {
                layoutElement.removeChild(child);
            }
        }
    }

    constructor(
        private updateHostClassService: UpdateHostClassService,
        private elementRef: ElementRef,
        private iconRegistry: ThyIconRegistry
    ) {
        updateHostClassService.initializeElement(elementRef.nativeElement);
    }

    updateClasses() {
        const [namespace, iconName] = this.iconRegistry.splitIconName(this.iconName);
        this.iconRegistry
            .getSvgIcon(iconName, namespace)
            .pipe(take(1))
            .subscribe(
                svg => this.setSvgElement(svg),
                (err: Error) => console.error(`Error retrieving icon: ${err.message}`)
            );
        // if (this.iconName) {
        //     const fontSetClass = this.iconSet
        //         ? this.iconRegistry.getFontSetClassByAlias(this.iconSet)
        //         : this.iconRegistry.getDefaultFontSetClass();
        //     this.updateHostClassService.updateClass([fontSetClass, `${fontSetClass}-${this.iconName}`]);
        // } else {
        //     const [namespace, iconName] = this.iconRegistry.splitIconName(this.iconName);
        //     this.iconRegistry
        //         .getSvgIcon(iconName, namespace)
        //         .pipe(take(1))
        //         .subscribe(
        //             svg => this.setSvgElement(svg),
        //             (err: Error) => console.log(`Error retrieving icon: ${err.message}`)
        //         );
        // }
    }

    ngOnInit() {
        this.updateClasses();
    }
}
