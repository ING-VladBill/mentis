import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

export default function RedireccionadorCandidato() {
  const { tipo } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  useEffect(() => {
    if (token) {
      navigate(`/candidato/acceso?token=${token}`, { replace: true });
    } else {
      navigate('/', { replace: true });
    }
  }, [token, navigate]);

  return null;
}
