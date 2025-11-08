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
  tp_mode: string;
  pyramids: Pyramid[];
}

const Row: React.FC<{ row: PositionGroup }> = ({ row }) => {
  const [open, setOpen] = useState(false);

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
        <TableCell>{row.status}</TableCell>
        <TableCell>{row.avg_entry_price}</TableCell>
        <TableCell>{row.tp_mode}</TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
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
                          <TableCell>{leg.price_gap}</TableCell>
                          <TableCell>{leg.capital_weight}</TableCell>
                          <TableCell>{leg.tp_target}</TableCell>
                          <TableCell>{leg.fill_price}</TableCell>
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
              <TableCell>Status</TableCell>
              <TableCell>Avg Entry Price</TableCell>
              <TableCell>TP Mode</TableCell>
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
