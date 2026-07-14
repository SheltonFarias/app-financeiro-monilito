import { useState, useEffect, useCallback } from "react";
import { fetchConfiguracoes, updateConfiguracao } from "../utils/apiService";

/**
 * Custom hook para buscar e gerenciar as configurações do sistema.
 */
export function useConfig() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const carregarConfig = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchConfiguracoes();
      setConfig(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarConfig();
  }, [carregarConfig]);

  const atualizarChave = async (chave, valor) => {
    await updateConfiguracao(chave, valor);
    // Atualiza o estado local otimisticamente
    setConfig(prev => ({ ...prev, [chave]: valor }));
  };

  return { config, loading, error, carregarConfig, atualizarChave };
}
