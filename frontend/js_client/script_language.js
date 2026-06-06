window.langueActuelle = localStorage.getItem('langue') || 'fr';

function traduireCle(cle) {
    return window.traductions?.[langueActuelle]?.[cle] || window.traductions?.french?.[cle] || '';
}

function traduirePage() {
    const elementsATraduire = document.querySelectorAll('[data-key], [data-placeholder], [data-value]');

    elementsATraduire.forEach(element => {
        const cle = element.getAttribute('data-key');
        if (cle) {
            const traduction = traduireCle(cle);

            if (traduction) {
                if (element.hasAttribute('data-html')) {
                    element.innerHTML = traduction;
                } else {
                    element.textContent = traduction;
                }
            }
        }

        const placeholderKey = element.getAttribute('data-placeholder');
        if (placeholderKey) {
            element.placeholder = traduireCle(placeholderKey);
        }

        const valueKey = element.getAttribute('data-value');
        if (valueKey) {
            element.value = traduireCle(valueKey);
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    traduirePage();
});
