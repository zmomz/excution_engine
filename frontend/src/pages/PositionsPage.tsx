import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Container,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Collapse,
  IconButton,
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';

interface DCALeg {
  id: number;
  price_gap: number;
  capital_weight: number;
  tp_target: number;
  fill_price: number | null;
  status: string;
}

interface Pyramid {
  id: number;
  entry_price: number;
  dca_legs: DCALeg[];
}

interface PositionGroup {
  id: number;
  pair: string;
  timeframe: string;
  status: string;
  avg_entry_price: number | null;
  unrealized_pnl_percent: number | null;
  unrealized_pnl_usd: number | null;
  tp_mode: string;
  pyramids: Pyramid[];
  pyramids_count: number;
  dca_legs_count: number;
}

const Row: React.FC<{ row: PositionGroup }> = ({ row }) => {
  const [open, setOpen] = useState(false);

  const pnlColor = row.unrealized_pnl_percent !== null
    ? (row.unrealized_pnl_percent >= 0 ? 'green' : 'red')
    : 'inherit';

  return (
    <React.Fragment>
      <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
        <TableCell>
          <IconButton
            aria-label="expand row"
            size="small"
            onClick={() => setOpen(!open)}
          >
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell component="th" scope="row">
          {row.pair}
        </TableCell>
        <TableCell>{row.timeframe}</TableCell>
        <TableCell>{row.pyramids_count} / 5</TableCell>
        <TableCell>{row.dca_legs_count} / {row.pyramids_count * 5} </TableCell> {/* Assuming 5 DCA legs per pyramid for now */}
        <TableCell>{row.avg_entry_price?.toFixed(2) || 'N/A'}</TableCell>
        <TableCell style={{ color: pnlColor }}>
          {row.unrealized_pnl_percent !== null ? `${row.unrealized_pnl_percent.toFixed(2)}%` : 'N/A'}
          {row.unrealized_pnl_usd !== null ? ` (${row.unrealized_pnl_usd.toFixed(2)}$)` : ''}
        </TableCell>
        <TableCell>{row.tp_mode}</TableCell>
        <TableCell>{row.status}</TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={9}> {/* Increased colSpan */}
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 1 }}>
              <Typography variant="h6" gutterBottom component="div">
                Pyramids
              </Typography>
              {row.pyramids.map((pyramid) => (
                <Box key={pyramid.id} sx={{ mb: 2 }}>
                  <Typography variant="subtitle1">Pyramid #{pyramid.id} (Entry: {pyramid.entry_price})</Typography>
                  <Table size="small" aria-label="dca legs">
                    <TableHead>
                      <TableRow>
                        <TableCell>DCA Leg</TableCell>
                        <TableCell>Price Gap</TableCell>
                        <TableCell>Weight</TableCell>
                        <TableCell>TP Target</TableCell>
                        <TableCell>Fill Price</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {pyramid.dca_legs.map((leg) => (
                        <TableRow key={leg.id}>
                          <TableCell>{leg.id}</TableCell>
                          <TableCell>{(leg.price_gap * 100).toFixed(2)}%</TableCell>
                          <TableCell>{(leg.capital_weight * 100).toFixed(2)}%</TableCell>
                          <TableCell>{(leg.tp_target * 100).toFixed(2)}%</TableCell>
                          <TableCell>{leg.fill_price?.toFixed(2) || 'N/A'}</TableCell>
                          <TableCell>{leg.status}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Box>
              ))}
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </React.Fragment>
  );
};

const PositionsPage: React.FC = () => {
  const [positionGroups, setPositionGroups] = useState<PositionGroup[]>([]);

  useEffect(() => {
    const fetchPositionGroups = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const response = await axios.get('http://localhost:8001/position-groups/', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setPositionGroups(response.data);
      } catch (err) {
        console.error('Failed to fetch position groups:', err);
      }
    };

    fetchPositionGroups();
    const interval = setInterval(fetchPositionGroups, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Container component="main" maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography component="h1" variant="h4" gutterBottom>
        Positions
      </Typography>
      <TableContainer component={Paper}>
        <Table aria-label="collapsible table">
          <TableHead>
            <TableRow>
              <TableCell />
              <TableCell>Pair</TableCell>
              <TableCell>Timeframe</TableCell>
              <TableCell>Pyramids</TableCell>
              <TableCell>DCA Filled</TableCell>
              <TableCell>Avg Entry Price</TableCell>
              <TableCell>Unrealized PnL</TableCell>
              <TableCell>TP Mode</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {positionGroups.map((row) => (
              <Row key={row.id} row={row} />
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
};

export default PositionsPage;
