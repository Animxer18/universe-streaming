function query(select){
        return document.querySelector(select)
}

(function (){
        const dropDown = query('.next-page');
        dropDown.addEventListener('click', () => {
                query('body').scrollY = window.outerHeight - 100;
                document.documentElement.scrollTop = window.outerHeight - 100;
        })
})()

function toggleClass(bool, elem, setClass){ 
        bool ? elem.classList.add(setClass) : elem.classList.remove(setClass);
}
    
(function setColorHeader(size, classSelect) {
        document.addEventListener('scroll', () => {
                toggleClass(window.scrollY > size, query('header', false), classSelect);
        });
})(200, 'header-select');