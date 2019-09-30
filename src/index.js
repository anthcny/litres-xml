
(async function() {
    const xmlText = await loadXMLText();

    if (xmlText.error) {
        return displayError(xmlText.error);
    }

    const xmlInfo = getXMLInfo(xmlText);

    return displayInfo(xmlInfo);
})()

async function loadXMLText() {
    const path = new URL(location.href).searchParams.get('XML');
    
    if(path) {  
        const response = await fetch(path);
        const { status } = response;

        if (status === 404) {
            return { error: `Документа ${path.slice(path.lastIndexOf('/') + 1)} не существует` }
        }
    
        return response.text();
    }

    return { error: 'Укажите путь к документу'};
}

function getXMLInfo(xmlText) {
    const scaner = new XmlScaner(xmlText);
    const links = scaner.getAllLinksArray();

    const result = { 
        linksNumber: links.length,
        textLenght: scaner.getContentTextLenght(),
        noralizedTextLenght: scaner.getNormalizedContentTextLenght(),
        invalidLinksNumber: scaner.countInvalidLinks(links),
    }

    return result;
}

class XmlScaner {
    constructor(xmlText) {
        this.doc = new DOMParser().parseFromString(xmlText, "application/xml");
    };

    getAllLinksArray() {
        const links = [ ...this.doc.querySelectorAll("a") ];
    
        return links;
    }

    getContentTextLenght() {
        const text = this.doc.firstChild.textContent;
        const slicedText = text.replace(/\s/g, '');
    
        return slicedText.length;
    }

    getNormalizedContentTextLenght() {
        const rootEl = this.doc.firstChild;
        rootEl.normalize();
        const cleanText = rootEl.textContent.replace(/\n/g, '');

        return cleanText.length;
    }

    countInvalidLinks(links) {
        const linkArray = links || this.getAllLinksArray();
        let count = 0;
    
        linkArray.forEach(link => {
            const href = link.getAttribute('l:href');
            if (!href) {
                return count++;
            }
            if (href[0] === '#') {
                const elem = this.doc.querySelector(href);
                if (!elem) count++;
            }
        })
    
        return count;
    }
}

function displayError(message) {
    const body = document.querySelector('body');
    const errorEl = document.createElement('div');
    errorEl.innerText = message;

    return body.appendChild(errorEl);
}

function displayInfo(info) {
    if (!info) return;

    const body = document.querySelector('body');
    const resultEl = document.createElement('div');
    const ul = document.createElement('ul');
    const labels = getLabels();

    Object.keys(info).forEach(key => {
        const li = document.createElement('li');
        li.innerText = `${labels[key]}: ${info[key]}`;
        ul.appendChild(li);
    });

    resultEl.innerText = 'Проверка xml файла';
    resultEl.appendChild(ul);
    return body.appendChild(resultEl);
}

function getLabels() {
    return {
        linksNumber: 'Число внутренних ссылок',
        textLenght: 'Суммарное число букв внутри тегов, не включая пробельные символы',
        noralizedTextLenght: 'Суммарное число букв нормализованного текста внутри тегов, включая и пробелы',
        invalidLinksNumber: 'Число битых внутренних ссылок'
    };
}

