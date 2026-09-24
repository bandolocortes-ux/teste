import { useEffect, useRef, useState } from 'react'

const API_URL = 'https://jsonplaceholder.typicode.com/users'

function App() {
  const [usuarios, setUsuarios] = useState([])
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [usuarioEmEdicao, setUsuarioEmEdicao] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [operacao, setOperacao] = useState(null)
  const [erro, setErro] = useState('')
  const controladorRef = useRef(null)

  useEffect(() => {
    const controlador = new AbortController()
    controladorRef.current = controlador

    async function carregarUsuarios() {
      try {
        const resposta = await fetch(API_URL, { signal: controlador.signal })
        if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`)
        setUsuarios(await resposta.json())
      } catch (e) {
        if (e.name !== 'AbortError') setErro(e.message)
      } finally {
        setCarregando(false)
      }
    }

    carregarUsuarios()

    return () => controlador.abort()
  }, [])

  function iniciarNovo() {
    setUsuarioEmEdicao(null)
    setNome('')
    setEmail('')
    setErro('')
  }

  function iniciarEdicao(usuario) {
    setUsuarioEmEdicao(usuario)
    setNome(usuario.name)
    setEmail(usuario.email)
    setErro('')
  }

  async function excluirUsuario(id) {
    const usuariosAnteriores = usuarios
    console.log(`Usuário ${id} excluído`)
    setErro('')
    setUsuarios((lista) => lista.filter((usuario) => usuario.id !== id))
    setOperacao(`excluir-${id}`)

    try {
      const resposta = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
        signal: controladorRef.current?.signal,
      })
      if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`)
    } catch (e) {
      if (e.name !== 'AbortError') {
        setUsuarios(usuariosAnteriores)
        setErro(`Erro: ${e.message}`)
      }
    } finally {
      setOperacao(null)
    }
  }

  async function salvarUsuario(e) {
    e.preventDefault()
    const usuariosAnteriores = usuarios
    const editando = usuarioEmEdicao !== null
    const url = editando ? `${API_URL}/${usuarioEmEdicao.id}` : API_URL
    const metodo = editando ? 'PUT' : 'POST'
    setErro('')
    setOperacao(editando ? 'editar' : 'novo')

    try {
      const resposta = await fetch(url, {
        method: metodo,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: nome, email }),
        signal: controladorRef.current?.signal,
      })
      if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`)
      const usuarioAtualizado = await resposta.json()

      if (editando) {
        setUsuarios((lista) =>
          lista.map((usuario) =>
            usuario.id === usuarioAtualizado.id ? usuarioAtualizado : usuario,
          ),
        )
      } else {
        setUsuarios((lista) => [...lista, usuarioAtualizado])
      }
      iniciarNovo()
    } catch (e) {
      if (e.name !== 'AbortError') {
        setUsuarios(usuariosAnteriores)
        setErro(`Erro: ${e.message}`)
      }
    } finally {
      setOperacao(null)
    }
  }

  const ocupado = operacao !== null

  return (
    <main className="crud-app">
      <header>
        <h1>Usuários</h1>
        <button type="button" onClick={iniciarNovo} disabled={ocupado}>
          Novo
        </button>
      </header>

      {erro && <p role="alert" className="erro">{erro}</p>}

      {(operacao === 'novo' || operacao === 'editar') && (
        <p>Salvando usuário...</p>
      )}

      <form onSubmit={salvarUsuario} className="usuario-form">
        <h2>{usuarioEmEdicao ? 'Editar usuário' : 'Novo usuário'}</h2>
        <input
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Nome"
          required
        />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="E-mail"
          required
        />
        <button type="submit" disabled={ocupado}>
          {usuarioEmEdicao ? 'Salvar' : 'Cadastrar'}
        </button>
        {usuarioEmEdicao && (
          <button type="button" onClick={iniciarNovo} disabled={ocupado}>
            Cancelar
          </button>
        )}
      </form>

      <section>
        <h2>Lista de usuários</h2>
        {carregando && <p>Carregando usuários...</p>}
        {!carregando && usuarios.length === 0 && <p>Nenhum usuário encontrado.</p>}
        <ul>
          {usuarios.map((usuario) => (
            <li key={usuario.id}>
              <span><strong>{usuario.name}</strong> ({usuario.email})</span>
              <span>
                <button type="button" onClick={() => iniciarEdicao(usuario)} disabled={ocupado}>
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => excluirUsuario(usuario.id)}
                  disabled={ocupado}
                >
                  {operacao === `excluir-${usuario.id}` ? 'Excluindo...' : 'Excluir'}
                </button>
              </span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  )
}

export default App