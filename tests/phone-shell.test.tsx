import { cleanup, render, screen, fireEvent } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { PhoneShell } from '../src/components/PhoneShell';
import { PhoneNavigation } from '../src/components/PhoneNavigation';
afterEach(cleanup);
it('keeps status bar outside the only scrolling content and navigation in the device overlay',()=>{
  const {container}=render(<PhoneShell><main>긴 페이지</main><PhoneNavigation><nav aria-label="주 메뉴"><button>홈</button></nav></PhoneNavigation></PhoneShell>);
  const scroll=container.querySelector('#phone-scroll')!;
  expect(scroll.contains(screen.getByLabelText('기기 상태바'))).toBe(false);
  expect(scroll.contains(screen.getByRole('navigation',{name:'주 메뉴'}))).toBe(false);
  expect(container.querySelector('#phone-navigation')?.contains(screen.getByRole('navigation'))).toBe(true);
  expect(container.querySelector('.phone-screen')?.contains(screen.getByLabelText('기기 상태바'))).toBe(true);
});
it('fits the entire device in a smaller browser while keeping the logical screen size stable',()=>{
  const originalWidth=window.innerWidth,originalHeight=window.innerHeight;
  Object.defineProperty(window,'innerWidth',{configurable:true,value:360});Object.defineProperty(window,'innerHeight',{configurable:true,value:740});
  const {container}=render(<PhoneShell><main>페이지</main></PhoneShell>);
  const footprint=container.querySelector('.device-footprint') as HTMLElement;
  expect(parseFloat(footprint.style.width)).toBeLessThanOrEqual(336);expect(parseFloat(footprint.style.height)).toBeLessThanOrEqual(716);
  Object.defineProperty(window,'innerWidth',{configurable:true,value:originalWidth});Object.defineProperty(window,'innerHeight',{configurable:true,value:originalHeight});fireEvent(window,new Event('resize'));
});
