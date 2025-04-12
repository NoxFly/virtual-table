import test from './test';

// --- webpack HMR section ---
declare const module: NodeJS.Module & {
    hot: {
        accept: () => void
    }
};


if(process.env.NODE_ENV !== "production") {
    // accept le rechargement à chaud si Webpack est celui qui a chargé ce script
    module?.hot?.accept();
    document.body.innerHTML = '';
    console.clear();
}


/* ----- */

test();