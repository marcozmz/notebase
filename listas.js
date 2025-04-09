document.addEventListener("DOMContentLoaded", () => {
  const btnAdicionar = document.getElementById("adicionar");
  const formulario = document.getElementById("formulario");
  const selectTipo = document.getElementById("tipo");
  const inputTexto = document.getElementById("texto-input");
  const inputImagem = document.getElementById("input-imagem");
  const inputLegenda = document.getElementById("input-legenda");
  const btnSalvar = document.getElementById("salvar");

  const checklist = document.getElementById("checklist");
  const listaImagens = document.getElementById("img");
  const listaTextos = document.getElementById("texto");

  let db;

  const request = indexedDB.open("Notebase", 1);

  request.onupgradeneeded = (event) => {
    let db = event.target.result;
    if (!db.objectStoreNames.contains("checklist")) {
      db.createObjectStore("checklist", { keyPath: "id", autoIncrement: true });
    }
    if (!db.objectStoreNames.contains("imagens")) {
      db.createObjectStore("imagens", { keyPath: "id", autoIncrement: true });
    }
    if (!db.objectStoreNames.contains("textos")) {
      db.createObjectStore("textos", { keyPath: "id", autoIncrement: true });
    }
  };

  request.onsuccess = (event) => {
    db = event.target.result;
    carregarListas();
  };

  btnAdicionar.addEventListener("click", () => {
    formulario.style.display =
      formulario.style.display === "none" ? "block" : "none";
  });

  inputTexto.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      btnSalvar.click();
    }
  });

  selectTipo.addEventListener("change", () => {
    const tipo = selectTipo.value;
    inputTexto.style.display = tipo === "imagem" ? "none" : "block";
    inputImagem.style.display = tipo === "imagem" ? "block" : "none";
    inputLegenda.style.display = tipo === "imagem" ? "block" : "none";
  });

  btnSalvar.addEventListener("click", () => {
    const tipo = selectTipo.value;

    if (tipo === "checklist") {
      adicionarItemChecklist(inputTexto.value);
    } else if (tipo === "imagem") {
      adicionarImagem(inputImagem.files[0], inputLegenda.value);
    } else if (tipo === "texto") {
      adicionarTexto(inputTexto.value);
    }
  });

  function adicionarItemChecklist(texto) {
    if (!texto.trim()) return;

    const transaction = db.transaction(["checklist"], "readwrite");
    const store = transaction.objectStore("checklist");
    store.add({ texto, concluido: false });

    transaction.oncomplete = () => {
      inputTexto.value = "";
      formulario.style.display = "none";
      carregarListas();
    };
  }

  function adicionarImagem(arquivo, legenda) {
    if (!arquivo) return;

    const reader = new FileReader();
    reader.onload = function (event) {
      const imageData = event.target.result;
      const transaction = db.transaction(["imagens"], "readwrite");
      const store = transaction.objectStore("imagens");
      store.add({ imageData, legenda });

      transaction.oncomplete = () => {
        inputImagem.value = "";
        inputLegenda.value = "";
        formulario.style.display = "none";
        carregarListas();
      };
    };
    reader.readAsDataURL(arquivo);
  }

  function adicionarTexto(texto) {
    if (!texto.trim()) return;

    const transaction = db.transaction(["textos"], "readwrite");
    const store = transaction.objectStore("textos");
    store.add({ texto });

    transaction.oncomplete = () => {
      inputTexto.value = "";
      formulario.style.display = "none";
      carregarListas();
    };
  }

  function carregarListas() {
    carregarChecklist();
    carregarImagens();
    carregarTextos();
  }

  function carregarChecklist() {
    checklist.innerHTML = "";
    const transaction = db.transaction(["checklist"], "readonly");
    const store = transaction.objectStore("checklist");
    const request = store.getAll();

    request.onsuccess = () => {
      request.result.forEach((item) => {
        const li = document.createElement("li");

        const textoSpan = document.createElement("span");
        textoSpan.textContent = item.texto;

        const botoesDiv = document.createElement("div");
        botoesDiv.classList.add("botoes");

        const concluirBtn = document.createElement("button");
        concluirBtn.classList.add("btn");
        concluirBtn.textContent = item.concluido ? "Desmarcar" : "Concluir";
        concluirBtn.onclick = () => toggleConcluido(item.id);

        const excluirBtn = document.createElement("button");
        excluirBtn.classList.add("btn");
        excluirBtn.textContent = "Excluir";
        excluirBtn.onclick = () => excluirItem("checklist", item.id);

        botoesDiv.appendChild(concluirBtn);
        botoesDiv.appendChild(excluirBtn);

        li.appendChild(textoSpan);
        li.appendChild(botoesDiv);
        checklist.appendChild(li);
      });
    };
  }

  function carregarImagens() {
    listaImagens.innerHTML = "";
    const transaction = db.transaction(["imagens"], "readonly");
    const store = transaction.objectStore("imagens");
    const request = store.getAll();

    request.onsuccess = () => {
      request.result.forEach((item) => {
        const li = document.createElement("li");

        const img = document.createElement("img");
        img.src = item.imageData;
        img.style.maxWidth = "200px";

        const legenda = document.createElement("p");
        legenda.textContent = item.legenda;

        const botoes = document.createElement("div");
        botoes.classList.add("botoes");

        const btnExcluir = document.createElement("button");
        btnExcluir.textContent = "Excluir";
        btnExcluir.classList.add("btn");
        btnExcluir.onclick = () => excluirItem("imagens", item.id);

        botoes.appendChild(btnExcluir);
        li.append(img, legenda, botoes);
        listaImagens.appendChild(li);
      });
    };
  }

  function carregarTextos() {
    listaTextos.innerHTML = "";
    const transaction = db.transaction(["textos"], "readonly");
    const store = transaction.objectStore("textos");
    const request = store.getAll();

    request.onsuccess = () => {
      request.result.forEach((item) => {
        const li = document.createElement("li");

        const paragrafo = document.createElement("p");
        paragrafo.textContent = item.texto;

        const botoes = document.createElement("div");
        botoes.classList.add("botoes");

        const btnExcluir = document.createElement("button");
        btnExcluir.textContent = "Excluir";
        btnExcluir.classList.add("btn");
        btnExcluir.onclick = () => excluirItem("textos", item.id);

        botoes.appendChild(btnExcluir);
        li.append(paragrafo, botoes);
        listaTextos.appendChild(li);
      });
    };
  }

  function toggleConcluido(id) {
    const transaction = db.transaction(["checklist"], "readwrite");
    const store = transaction.objectStore("checklist");
    const request = store.get(id);

    request.onsuccess = () => {
      const item = request.result;
      item.concluido = !item.concluido;
      store.put(item);
      carregarListas();
    };
  }

  function excluirItem(storeName, id) {
    const transaction = db.transaction([storeName], "readwrite");
    const store = transaction.objectStore(storeName);
    store.delete(id);

    transaction.oncomplete = () => {
      carregarListas();
    };
  }
});
