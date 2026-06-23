import { Directive, ElementRef, HostBinding, HostListener } from '@angular/core';

/**
 * Makes a non-button clickable element keyboard-operable (WCAG 2.1.1 Keyboard,
 * 4.1.2 Name/Role/Value): exposes role="button" + tabindex, and activates the
 * element's existing (click) handler on Enter/Space. Purely behavioural -- the
 * element's visual styling is untouched. Pair with a `:focus-visible` rule so
 * keyboard focus is visible (2.4.7).
 */
@Directive({
  selector: '[appClickable]',
  standalone: true
})
export class ClickableDirective {
  @HostBinding('attr.role') readonly role = 'button';
  @HostBinding('attr.tabindex') readonly tabindex = '0';

  constructor(private el: ElementRef<HTMLElement>) {}

  @HostListener('keydown.enter', ['$event'])
  @HostListener('keydown.space', ['$event'])
  activate(event: Event): void {
    event.preventDefault();
    this.el.nativeElement.click();
  }
}
