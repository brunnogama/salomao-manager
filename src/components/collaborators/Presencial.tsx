const handleClearHistory = async () => {
      const confirmacao = confirm(
        "⚠️ ATENÇÃO: Isso apagará TODOS os registros de presença.\n\n" +
        "Essa ação não pode ser desfeita. Tem certeza?"
      )

      if (!confirmacao) return;

      setDeleting(true)
      try {
          // Tenta apagar todos os registros onde o ID não é nulo
          const { error, count } = await supabase
            .from('presenca_portaria')
            .delete({ count: 'exact' })
            .neq('id', '00000000-0000-0000-0000-000000000000') 
          
          if (error) throw error

          // Se count for 0, significa que o banco bloqueou ou não tinha nada
          if (count === 0 && records.length > 0) {
             alert("O banco de dados bloqueou a exclusão. Verifique se você rodou o comando SQL de permissão 'delete'.")
          } else {
             alert("Base de dados limpa com sucesso!")
             setRecords([]) 
             fetchRecords()
          }

      } catch (error: any) {
          console.error(error)
          alert("Erro ao apagar: " + error.message)
      } finally {
          setDeleting(false)
      }
  }
