function iw(opts){
	if(!opts) return 16;
	else if(typeof opts == 'number') return opts;
	else if(opts.s) return opts.s;
	else if(opts.w) return opts.w;
	return 16;
}

function ih(opts){
	if(!opts) return 16;
	else if(typeof opts == 'number') return opts;
	else if(opts.s) return opts.s;
	else if(opts.h) return opts.h;
	return 16;
}

function ic(opts){
	if(!opts) return 'currentColor';
	else if(opts.c) return opts.c;
	else if(opts.color) return opts.color;
	return 'currentColor';
}

function svgIcon(svg, o){
	return `<svg class="icon-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="${iw(o)}" height="${ih(o)}" fill="none" stroke="${ic(o)}" stroke-linecap="round" stroke-linejoin="round" stroke-width="2">${svg}</svg>`;
}

export const iconReload = (o) => svgIcon('<path d="M29 16 C29 22 24 29 16 29 8 29 3 22 3 16 3 10 8 3 16 3 21 3 25 6 27 9 M20 10 L27 9 28 2" />', o);
export const iconTrash = (o) => svgIcon('<path d="M28 6 L6 6 8 30 24 30 26 6 4 6 M16 12 L16 24 M21 12 L20 24 M11 12 L12 24 M12 6 L13 2 19 2 20 6" />', o);
export const iconMail = (o) => svgIcon('<path d="M2 26 L30 26 30 6 2 6 Z M2 6 L16 16 30 6" />', o);
