import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { FileText, Download } from "lucide-react"
import { jsPDF } from "jspdf"
import { toast } from "sonner"

export default function Documentation() {
  const [documentData, setDocumentData] = useState({
    titulo: "Sistema de Gestão de Transporte e Logística",
    subtitulo: "Desenvolvimento de Sistemas",
    instituicao: "SENAI",
    curso: "Técnico em Desenvolvimento de Sistemas",
    equipe: [
      { nome: "", funcao: "" }
    ],
    problematizacao: "",
    planejamento: "",
    desenvolvimento: "",
    personas: "",
    funcionalidades: "",
    regrasNegocio: "",
    requisitosFunc: "",
    requisitosNaoFunc: "",
    sprints: Array(8).fill(null).map((_, i) => ({
      numero: i + 1,
      planejado: "",
      executado: "",
      dailys: ""
    })),
    conceito: "",
    cores: "",
    fluxoTelas: "",
    endpointsBackend: "",
    referências: ""
  })

  const generatePDF = () => {
    try {
      const doc = new jsPDF()
      let yPos = 20
      const pageHeight = doc.internal.pageSize.height
      const margin = 20
      const lineHeight = 7

      // Função auxiliar para adicionar nova página se necessário
      const checkAddPage = (needed: number = lineHeight) => {
        if (yPos + needed > pageHeight - margin) {
          doc.addPage()
          yPos = margin
          return true
        }
        return false
      }

      // Função auxiliar para adicionar texto com quebra automática
      const addText = (text: string, fontSize: number = 11, isBold: boolean = false) => {
        if (isBold) {
          doc.setFont("helvetica", "bold")
        } else {
          doc.setFont("helvetica", "normal")
        }
        doc.setFontSize(fontSize)
        const lines = doc.splitTextToSize(text, 170)
        lines.forEach((line: string) => {
          checkAddPage()
          doc.text(line, margin, yPos)
          yPos += lineHeight
        })
      }

      // Capa - ABNT
      doc.setFont("helvetica", "bold")
      doc.setFontSize(16)
      doc.text(documentData.instituicao, 105, 40, { align: "center" })
      doc.setFontSize(14)
      doc.text(documentData.curso, 105, 50, { align: "center" })
      
      doc.setFontSize(18)
      yPos = 120
      const titleLines = doc.splitTextToSize(documentData.titulo, 150)
      titleLines.forEach((line: string) => {
        doc.text(line, 105, yPos, { align: "center" })
        yPos += 10
      })

      doc.setFontSize(12)
      doc.setFont("helvetica", "normal")
      doc.text(documentData.subtitulo, 105, yPos + 10, { align: "center" })
      
      doc.setFontSize(11)
      doc.text(new Date().getFullYear().toString(), 105, pageHeight - 30, { align: "center" })

      // Página de Equipe
      doc.addPage()
      yPos = margin
      addText("EQUIPE", 16, true)
      yPos += 5
      
      documentData.equipe.forEach((membro, index) => {
        if (membro.nome) {
          checkAddPage(lineHeight * 3)
          addText(`${index + 1}. ${membro.nome}`, 12, true)
          addText(`   Função: ${membro.funcao || "Não especificada"}`, 11)
          yPos += 3
        }
      })

      // Sumário
      doc.addPage()
      yPos = margin
      addText("SUMÁRIO", 16, true)
      yPos += 5
      const sections = [
        "1. ESCOPO E CONTEXTO DO PROJETO",
        "   1.1 Problematização",
        "   1.2 Planejamento",
        "   1.3 Desenvolvimento",
        "2. PERSONAS",
        "3. FUNCIONALIDADES",
        "4. REGRAS DE NEGÓCIO",
        "5. REQUISITOS FUNCIONAIS E NÃO FUNCIONAIS",
        "6. RELATÓRIOS DAS SPRINTS",
        "7. CONCEITO E DESIGN",
        "8. DOCUMENTAÇÃO DE BACKEND",
        "9. REFERÊNCIAS"
      ]
      sections.forEach(section => {
        addText(section, 11)
      })

      // Escopo e Contexto
      doc.addPage()
      yPos = margin
      addText("1. ESCOPO E CONTEXTO DO PROJETO", 14, true)
      yPos += 5
      
      addText("1.1 Problematização", 12, true)
      if (documentData.problematizacao) {
        addText(documentData.problematizacao, 11)
      } else {
        addText("(Descrever o problema que o sistema resolve)", 11)
      }
      yPos += 5

      addText("1.2 Planejamento", 12, true)
      if (documentData.planejamento) {
        addText(documentData.planejamento, 11)
      } else {
        addText("(Descrever como o projeto foi planejado)", 11)
      }
      yPos += 5

      addText("1.3 Desenvolvimento", 12, true)
      if (documentData.desenvolvimento) {
        addText(documentData.desenvolvimento, 11)
      } else {
        addText("(Descrever o processo de desenvolvimento)", 11)
      }

      // Personas
      doc.addPage()
      yPos = margin
      addText("2. PERSONAS", 14, true)
      yPos += 5
      if (documentData.personas) {
        addText(documentData.personas, 11)
      } else {
        addText("(Descrever as personas do sistema - usuários-alvo)", 11)
      }

      // Funcionalidades
      doc.addPage()
      yPos = margin
      addText("3. FUNCIONALIDADES", 14, true)
      yPos += 5
      if (documentData.funcionalidades) {
        addText(documentData.funcionalidades, 11)
      } else {
        addText("O sistema oferece as seguintes funcionalidades principais:", 11)
        addText("• Gestão de Veículos", 11)
        addText("• Gestão de Rotas", 11)
        addText("• Planejamento de Viagens", 11)
        addText("• Cálculo de Custos", 11)
        addText("• Simulações de Cenários", 11)
        addText("• Relatórios Gerenciais", 11)
      }

      // Regras de Negócio
      doc.addPage()
      yPos = margin
      addText("4. REGRAS DE NEGÓCIO", 14, true)
      yPos += 5
      if (documentData.regrasNegocio) {
        addText(documentData.regrasNegocio, 11)
      } else {
        addText("(Descrever as regras de negócio do sistema)", 11)
      }

      // Requisitos
      doc.addPage()
      yPos = margin
      addText("5. REQUISITOS FUNCIONAIS E NÃO FUNCIONAIS", 14, true)
      yPos += 5
      
      addText("5.1 Requisitos Funcionais", 12, true)
      if (documentData.requisitosFunc) {
        addText(documentData.requisitosFunc, 11)
      } else {
        addText("(Listar os requisitos funcionais do sistema)", 11)
      }
      yPos += 5

      addText("5.2 Requisitos Não Funcionais", 12, true)
      if (documentData.requisitosNaoFunc) {
        addText(documentData.requisitosNaoFunc, 11)
      } else {
        addText("(Listar os requisitos não funcionais - performance, segurança, usabilidade)", 11)
      }

      // Sprints
      doc.addPage()
      yPos = margin
      addText("6. RELATÓRIOS DAS SPRINTS", 14, true)
      yPos += 5

      documentData.sprints.forEach((sprint) => {
        checkAddPage(lineHeight * 8)
        addText(`Sprint ${sprint.numero}`, 12, true)
        yPos += 2
        
        addText("O que foi planejado:", 11, true)
        if (sprint.planejado) {
          addText(sprint.planejado, 11)
        } else {
          addText("(Descrever o que foi planejado para esta sprint)", 11)
        }
        yPos += 2

        addText("O que foi executado:", 11, true)
        if (sprint.executado) {
          addText(sprint.executado, 11)
        } else {
          addText("(Descrever o que foi executado nesta sprint)", 11)
        }
        yPos += 2

        addText("Relatórios das dailys:", 11, true)
        if (sprint.dailys) {
          addText(sprint.dailys, 11)
        } else {
          addText("(Resumo das reuniões diárias)", 11)
        }
        yPos += 5
      })

      // Conceito e Design
      doc.addPage()
      yPos = margin
      addText("7. CONCEITO E DESIGN", 14, true)
      yPos += 5
      
      addText("7.1 Conceito do Projeto", 12, true)
      if (documentData.conceito) {
        addText(documentData.conceito, 11)
      } else {
        addText("(Explicar o conceito e a ideia do projeto)", 11)
      }
      yPos += 5

      addText("7.2 Cores Escolhidas", 12, true)
      if (documentData.cores) {
        addText(documentData.cores, 11)
      } else {
        addText("(Descrever a paleta de cores e justificativa)", 11)
      }
      yPos += 5

      addText("7.3 Fluxo de Telas", 12, true)
      if (documentData.fluxoTelas) {
        addText(documentData.fluxoTelas, 11)
      } else {
        addText("(Descrever o fluxo de navegação entre as telas)", 11)
      }

      // Backend
      doc.addPage()
      yPos = margin
      addText("8. DOCUMENTAÇÃO DE BACKEND", 14, true)
      yPos += 5
      
      addText("8.1 Endpoints e Rotas", 12, true)
      if (documentData.endpointsBackend) {
        addText(documentData.endpointsBackend, 11)
      } else {
        addText("(Documentar os endpoints do backend)", 11)
        addText("Exemplo:", 11)
        addText("POST /api/viagens - Criar nova viagem", 11)
        addText("GET /api/veiculos - Listar veículos", 11)
        addText("PUT /api/simulacoes/:id - Atualizar simulação", 11)
      }

      // Referências
      doc.addPage()
      yPos = margin
      addText("9. REFERÊNCIAS", 14, true)
      yPos += 5
      if (documentData.referências) {
        addText(documentData.referências, 11)
      } else {
        addText("(Listar as referências bibliográficas seguindo ABNT)", 11)
      }

      // Salvar PDF
      doc.save(`TCC_${documentData.titulo.replace(/\s+/g, '_')}.pdf`)
      toast.success("PDF gerado com sucesso!")
    } catch (error) {
      console.error("Erro ao gerar PDF:", error)
      toast.error("Erro ao gerar PDF. Tente novamente.")
    }
  }

  const updateEquipe = (index: number, field: 'nome' | 'funcao', value: string) => {
    const newEquipe = [...documentData.equipe]
    newEquipe[index] = { ...newEquipe[index], [field]: value }
    setDocumentData({ ...documentData, equipe: newEquipe })
  }

  const addMembro = () => {
    setDocumentData({
      ...documentData,
      equipe: [...documentData.equipe, { nome: "", funcao: "" }]
    })
  }

  const updateSprint = (index: number, field: 'planejado' | 'executado' | 'dailys', value: string) => {
    const newSprints = [...documentData.sprints]
    newSprints[index] = { ...newSprints[index], [field]: value }
    setDocumentData({ ...documentData, sprints: newSprints })
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <FileText className="h-8 w-8" />
            Documentação TCC - ABNT
          </h1>
          <p className="text-muted-foreground mt-2">
            Preencha os campos abaixo para gerar a documentação completa do projeto
          </p>
        </div>
        <Button onClick={generatePDF} size="lg" className="gap-2">
          <Download className="h-5 w-5" />
          Gerar PDF
        </Button>
      </div>

      {/* Informações Básicas */}
      <Card>
        <CardHeader>
          <CardTitle>Informações Básicas</CardTitle>
          <CardDescription>Dados da capa e identificação do projeto</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="titulo">Título do Projeto</Label>
              <Input
                id="titulo"
                value={documentData.titulo}
                onChange={(e) => setDocumentData({ ...documentData, titulo: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="subtitulo">Subtítulo</Label>
              <Input
                id="subtitulo"
                value={documentData.subtitulo}
                onChange={(e) => setDocumentData({ ...documentData, subtitulo: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="instituicao">Instituição</Label>
              <Input
                id="instituicao"
                value={documentData.instituicao}
                onChange={(e) => setDocumentData({ ...documentData, instituicao: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="curso">Curso</Label>
              <Input
                id="curso"
                value={documentData.curso}
                onChange={(e) => setDocumentData({ ...documentData, curso: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Equipe */}
      <Card>
        <CardHeader>
          <CardTitle>Equipe do Projeto</CardTitle>
          <CardDescription>Membros da equipe e suas funções</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {documentData.equipe.map((membro, index) => (
            <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg">
              <div>
                <Label>Nome do Membro {index + 1}</Label>
                <Input
                  value={membro.nome}
                  onChange={(e) => updateEquipe(index, 'nome', e.target.value)}
                  placeholder="Nome completo"
                />
              </div>
              <div>
                <Label>Função</Label>
                <Input
                  value={membro.funcao}
                  onChange={(e) => updateEquipe(index, 'funcao', e.target.value)}
                  placeholder="Ex: Desenvolvedor Frontend"
                />
              </div>
            </div>
          ))}
          <Button onClick={addMembro} variant="outline">Adicionar Membro</Button>
        </CardContent>
      </Card>

      {/* Escopo e Contexto */}
      <Card>
        <CardHeader>
          <CardTitle>Escopo e Contexto do Projeto</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="problematizacao">Problematização</Label>
            <Textarea
              id="problematizacao"
              value={documentData.problematizacao}
              onChange={(e) => setDocumentData({ ...documentData, problematizacao: e.target.value })}
              rows={4}
              placeholder="Descreva o problema que o sistema resolve..."
            />
          </div>
          <div>
            <Label htmlFor="planejamento">Planejamento</Label>
            <Textarea
              id="planejamento"
              value={documentData.planejamento}
              onChange={(e) => setDocumentData({ ...documentData, planejamento: e.target.value })}
              rows={4}
              placeholder="Descreva como o projeto foi planejado..."
            />
          </div>
          <div>
            <Label htmlFor="desenvolvimento">Desenvolvimento</Label>
            <Textarea
              id="desenvolvimento"
              value={documentData.desenvolvimento}
              onChange={(e) => setDocumentData({ ...documentData, desenvolvimento: e.target.value })}
              rows={4}
              placeholder="Descreva o processo de desenvolvimento..."
            />
          </div>
        </CardContent>
      </Card>

      {/* Personas e Funcionalidades */}
      <Card>
        <CardHeader>
          <CardTitle>Personas e Funcionalidades</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="personas">Personas</Label>
            <Textarea
              id="personas"
              value={documentData.personas}
              onChange={(e) => setDocumentData({ ...documentData, personas: e.target.value })}
              rows={4}
              placeholder="Descreva as personas do sistema..."
            />
          </div>
          <div>
            <Label htmlFor="funcionalidades">Funcionalidades</Label>
            <Textarea
              id="funcionalidades"
              value={documentData.funcionalidades}
              onChange={(e) => setDocumentData({ ...documentData, funcionalidades: e.target.value })}
              rows={4}
              placeholder="Liste as principais funcionalidades do sistema..."
            />
          </div>
        </CardContent>
      </Card>

      {/* Regras de Negócio e Requisitos */}
      <Card>
        <CardHeader>
          <CardTitle>Regras de Negócio e Requisitos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="regrasNegocio">Regras de Negócio</Label>
            <Textarea
              id="regrasNegocio"
              value={documentData.regrasNegocio}
              onChange={(e) => setDocumentData({ ...documentData, regrasNegocio: e.target.value })}
              rows={4}
              placeholder="Descreva as regras de negócio..."
            />
          </div>
          <div>
            <Label htmlFor="requisitosFunc">Requisitos Funcionais</Label>
            <Textarea
              id="requisitosFunc"
              value={documentData.requisitosFunc}
              onChange={(e) => setDocumentData({ ...documentData, requisitosFunc: e.target.value })}
              rows={4}
              placeholder="Liste os requisitos funcionais..."
            />
          </div>
          <div>
            <Label htmlFor="requisitosNaoFunc">Requisitos Não Funcionais</Label>
            <Textarea
              id="requisitosNaoFunc"
              value={documentData.requisitosNaoFunc}
              onChange={(e) => setDocumentData({ ...documentData, requisitosNaoFunc: e.target.value })}
              rows={4}
              placeholder="Liste os requisitos não funcionais..."
            />
          </div>
        </CardContent>
      </Card>

      {/* Sprints */}
      <Card>
        <CardHeader>
          <CardTitle>Relatórios das Sprints</CardTitle>
          <CardDescription>Documentação das 8 sprints do projeto</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {documentData.sprints.map((sprint, index) => (
            <div key={index} className="border rounded-lg p-4 space-y-4">
              <h3 className="font-semibold text-lg">Sprint {sprint.numero}</h3>
              <div>
                <Label>O que foi planejado</Label>
                <Textarea
                  value={sprint.planejado}
                  onChange={(e) => updateSprint(index, 'planejado', e.target.value)}
                  rows={2}
                  placeholder="Descreva o que foi planejado..."
                />
              </div>
              <div>
                <Label>O que foi executado</Label>
                <Textarea
                  value={sprint.executado}
                  onChange={(e) => updateSprint(index, 'executado', e.target.value)}
                  rows={2}
                  placeholder="Descreva o que foi executado..."
                />
              </div>
              <div>
                <Label>Relatórios das dailys</Label>
                <Textarea
                  value={sprint.dailys}
                  onChange={(e) => updateSprint(index, 'dailys', e.target.value)}
                  rows={2}
                  placeholder="Resumo das reuniões diárias..."
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Design e Conceito */}
      <Card>
        <CardHeader>
          <CardTitle>Conceito e Design</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="conceito">Conceito do Projeto</Label>
            <Textarea
              id="conceito"
              value={documentData.conceito}
              onChange={(e) => setDocumentData({ ...documentData, conceito: e.target.value })}
              rows={4}
              placeholder="Explique o conceito e a ideia do projeto..."
            />
          </div>
          <div>
            <Label htmlFor="cores">Cores Escolhidas</Label>
            <Textarea
              id="cores"
              value={documentData.cores}
              onChange={(e) => setDocumentData({ ...documentData, cores: e.target.value })}
              rows={3}
              placeholder="Descreva a paleta de cores e justificativa..."
            />
          </div>
          <div>
            <Label htmlFor="fluxoTelas">Fluxo de Telas</Label>
            <Textarea
              id="fluxoTelas"
              value={documentData.fluxoTelas}
              onChange={(e) => setDocumentData({ ...documentData, fluxoTelas: e.target.value })}
              rows={4}
              placeholder="Descreva o fluxo de navegação..."
            />
          </div>
        </CardContent>
      </Card>

      {/* Backend */}
      <Card>
        <CardHeader>
          <CardTitle>Documentação de Backend</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="endpointsBackend">Endpoints e Rotas</Label>
            <Textarea
              id="endpointsBackend"
              value={documentData.endpointsBackend}
              onChange={(e) => setDocumentData({ ...documentData, endpointsBackend: e.target.value })}
              rows={6}
              placeholder="Documente os endpoints do backend..."
            />
          </div>
        </CardContent>
      </Card>

      {/* Referências */}
      <Card>
        <CardHeader>
          <CardTitle>Referências</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="referências">Referências Bibliográficas (ABNT)</Label>
            <Textarea
              id="referências"
              value={documentData.referências}
              onChange={(e) => setDocumentData({ ...documentData, referências: e.target.value })}
              rows={6}
              placeholder="Liste as referências no formato ABNT..."
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={generatePDF} size="lg" className="gap-2">
          <Download className="h-5 w-5" />
          Gerar PDF Completo
        </Button>
      </div>
    </div>
  )
}
