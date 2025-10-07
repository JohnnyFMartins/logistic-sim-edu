import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: { headers: { Authorization: req.headers.get('Authorization')! } }
      }
    )

    const { viagemId } = await req.json()

    if (!viagemId) {
      return new Response(
        JSON.stringify({ error: 'ID da viagem é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get current user
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Usuário não autenticado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Recalculando custos para viagem:', viagemId)

    // Get trip data
    const { data: trip, error: tripError } = await supabaseClient
      .from('trips')
      .select('id, vehicle_id, route_id, peso_ton')
      .eq('id', viagemId)
      .eq('user_id', user.id)
      .single()

    if (tripError || !trip) {
      console.error('Erro ao buscar viagem:', tripError)
      return new Response(
        JSON.stringify({ error: 'Viagem não encontrada' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get vehicle data
    const { data: vehicle, error: vehicleError } = await supabaseClient
      .from('vehicles')
      .select('km_por_litro, capacidade_ton')
      .eq('id', trip.vehicle_id)
      .single()

    if (vehicleError || !vehicle) {
      console.error('Erro ao buscar veículo:', vehicleError)
      return new Response(
        JSON.stringify({ error: 'Veículo não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get route data
    const { data: route, error: routeError } = await supabaseClient
      .from('routes')
      .select('distancia_km')
      .eq('id', trip.route_id)
      .single()

    if (routeError || !route) {
      console.error('Erro ao buscar rota:', routeError)
      return new Response(
        JSON.stringify({ error: 'Rota não encontrada' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get global parameters
    const { data: params, error: paramsError } = await supabaseClient
      .from('parametros_globais')
      .select('preco_diesel_litro, velocidade_media_kmh')
      .eq('user_id', user.id)
      .single()

    if (paramsError || !params) {
      console.error('Erro ao buscar parâmetros globais:', paramsError)
      return new Response(
        JSON.stringify({ error: 'Parâmetros globais não encontrados' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get active variable costs
    const { data: variableCosts, error: variableCostsError } = await supabaseClient
      .from('custos_variaveis')
      .select('valor_por_km')
      .eq('user_id', user.id)
      .eq('ativo', true)

    if (variableCostsError) {
      console.error('Erro ao buscar custos variáveis:', variableCostsError)
      return new Response(
        JSON.stringify({ error: 'Erro ao buscar custos variáveis' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get tolls for route
    const { data: tolls, error: tollsError } = await supabaseClient
      .from('pedagios')
      .select('valor')
      .eq('user_id', user.id)
      .eq('rota_id', trip.route_id)

    if (tollsError) {
      console.error('Erro ao buscar pedágios:', tollsError)
      return new Response(
        JSON.stringify({ error: 'Erro ao buscar pedágios' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get active fixed costs
    const { data: fixedCosts, error: fixedCostsError } = await supabaseClient
      .from('custos_fixos')
      .select('valor_mensal')
      .eq('user_id', user.id)
      .eq('ativo', true)

    if (fixedCostsError) {
      console.error('Erro ao buscar custos fixos:', fixedCostsError)
      return new Response(
        JSON.stringify({ error: 'Erro ao buscar custos fixos' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Perform calculations
    const distanciaKm = Number(route.distancia_km) || 0
    const kmPorLitro = Number(vehicle.km_por_litro) || 1
    const precoDieselLitro = Number(params.preco_diesel_litro) || 0
    const velocidadeMediaKmh = Number(params.velocidade_media_kmh) || 60

    // 1. Fuel consumption (L) = distance_km / km_per_liter
    const consumoCombustivelL = distanciaKm / kmPorLitro

    // 2. Fuel cost = consumption × diesel_price_per_liter
    const custoCombustivel = consumoCombustivelL * precoDieselLitro

    // 3. Variable costs = (sum of active variable costs per km) × distance_km
    const custoVariaveis = (variableCosts?.reduce((sum, cost) => sum + Number(cost.valor_por_km), 0) || 0) * distanciaKm

    // 4. Tolls = sum of tolls for the route
    const custoPedagios = tolls?.reduce((sum, toll) => sum + Number(toll.valor), 0) || 0

    // 5. Daily fixed cost = (sum of active monthly fixed costs / 30)
    const custoFixoRateado = (fixedCosts?.reduce((sum, cost) => sum + Number(cost.valor_mensal), 0) || 0) / 30

    // 6. Total estimated cost
    const custoTotalEstimado = custoCombustivel + custoVariaveis + custoPedagios + custoFixoRateado

    // 7. Estimated time (h) = distance_km / average_speed_kmh
    const tempoEstimadoH = distanciaKm / velocidadeMediaKmh

    // Update trip with calculated values
    const { error: updateError } = await supabaseClient
      .from('trips')
      .update({
        consumo_combustivel_l: consumoCombustivelL,
        custo_combustivel: custoCombustivel,
        custo_variaveis: custoVariaveis,
        custo_pedagios: custoPedagios,
        custo_fixo_rateado: custoFixoRateado,
        custo_total_estimado: custoTotalEstimado,
        tempo_estimado_h: tempoEstimadoH,
        updated_at: new Date().toISOString()
      })
      .eq('id', viagemId)
      .eq('user_id', user.id)

    if (updateError) {
      console.error('Erro ao atualizar viagem:', updateError)
      return new Response(
        JSON.stringify({ error: 'Erro ao atualizar cálculos da viagem' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Cálculos atualizados com sucesso para viagem:', viagemId)

    return new Response(
      JSON.stringify({ 
        message: 'Cálculos atualizados com sucesso',
        calculations: {
          consumo_combustivel_l: consumoCombustivelL,
          custo_combustivel: custoCombustivel,
          custo_variaveis: custoVariaveis,
          custo_pedagios: custoPedagios,
          custo_fixo_rateado: custoFixoRateado,
          custo_total_estimado: custoTotalEstimado,
          tempo_estimado_h: tempoEstimadoH
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Erro interno:', error)
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})