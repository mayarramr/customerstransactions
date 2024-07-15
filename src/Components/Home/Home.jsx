import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { BarChart, Bar, Rectangle, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

export default function Home() {
    const [data, setData] = useState({ customers: [], transactions: [] });
    const [filteredCustomers, setFilteredCustomers] = useState([]);
    const [filterName, setFilterName] = useState('');
    const [filterAmount, setFilterAmount] = useState('');
    const [error , setError] = useState(null)
    const colors = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', 'red', 'pink'];
    const getPath = (x, y, width, height) => {
        return `M${x},${y + height}C${x + width / 3},${y + height} ${x + width / 2},${y + height / 3}
        ${x + width / 2}, ${y}
        C${x + width / 2},${y + height / 3} ${x + (2 * width) / 3},${y + height} ${x + width}, ${y + height}
        Z`;
    };

    const TriangleBar = (props) => {
        const { fill, x, y, width, height } = props;

        return <path d={getPath(x, y, width, height)} stroke="none" fill={fill} />;
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const customersResponse = await axios.get('http://localhost:3001/customers');
                const transactionsResponse = await axios.get('http://localhost:3001/transactions');

                setData({
                    customers: customersResponse.data,
                    transactions: transactionsResponse.data,
                });
                setFilteredCustomers(customersResponse.data);
            } catch (error) {
                console.error('Error fetching data:', error);
                setError(error);
            }
        };

        fetchData();
    }, []);

    const handleNameFilterChange = (event) => {
        const value = event.target.value.toLowerCase();
        setFilterName(value);
        filterData(value, filterAmount);
    };

    const handleAmountFilterChange = (event) => {
        const value = event.target.value.trim(); 
        const parsedValue = parseFloat(value);
    
        if (!isNaN(parsedValue)) {
            setFilterAmount(parsedValue);
            filterData(filterName, parsedValue);
        } else {
            setFilterAmount(''); 
            filterData(filterName, ''); 
        }
    };
    

    const filterData = (name, amount) => {
        let filtered = data.customers;

        if (name) {
            filtered = filtered.filter(customer =>
                customer.name.toLowerCase().includes(name)
            );
        }

        if (amount) {
            filtered = filtered.filter(customer =>
                data.transactions.some(transaction =>
                    transaction.customer_id === customer.id && transaction.amount >= amount
                )
            );
        }

        setFilteredCustomers(filtered);
    };

    const getCustomerTransactions = (customerId) => {
        return data.transactions.filter(transaction => transaction.customer_id === customerId);
    };

    const getTotalTransactionsPerDay = () => {
        if (!filteredCustomers.length) return [];
        const totals = data.transactions.reduce((acc, transaction) => {
            if (filteredCustomers.some(customer => customer.id === transaction.customer_id)) {
                acc[transaction.date] = (acc[transaction.date] || 0) + transaction.amount;
            }
            return acc;
        }, {});
        return Object.keys(totals).map(date => ({ date, amount: totals[date] }));
    };

    const transactionData = getTotalTransactionsPerDay().map(t => ({ name: t.date, uv: t.amount, pv: t.amount }));

    if (error) {
        return <div>Error fetching data: {error.message}</div>;
    }

    return (
        <div className="container">
            <h1>Customer Transactions</h1>
            <div className="row">
                <div className="col-md-7">
                    <div className="row">
                        <div className="col-md-6 ">
                            <div>
                                <label>Search by customer name: </label>
                                <input type="text" className="form-control" value={filterName} onChange={handleNameFilterChange} />
                            </div>

                        </div>
                        <div className="col-md-6">

                            <div>
                                <label>Filter by transaction amount: </label>
                                <input type="text" className="form-control" value={filterAmount} onChange={handleAmountFilterChange}></input>
                            </div>
                        </div>
                    </div>
                    <table className='table table-striped my-3'>
                        <thead>
                            <tr className="text-center">
                                <th>Customer ID</th>
                                <th>Customer Name</th>
                                <th>Date</th>
                                <th>Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredCustomers.map(customer => (
                                <tr className="text-center" key={customer.id}>
                                    <td >{customer.id}</td>
                                    <td>{customer.name}</td>
                                    <td>
                                        <ul className="p-0">
                                            {getCustomerTransactions(customer.id).map(transaction => (
                                                <li key={transaction.id} >
                                                    {transaction.date}
                                                </li>
                                            ))}
                                        </ul>
                                    </td>
                                    <td>
                                        <ul className="p-0">
                                            {getCustomerTransactions(customer.id).map(transaction => (
                                                <li key={transaction.id}>
                                                    {transaction.amount}
                                                </li>
                                            ))}
                                        </ul>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="col-md-5 d-flex flex-column align-items-center justify-content-center">
                    <h2>Transactions Graph</h2>
                    <BarChart
                        width={500}
                        height={300}
                        data={transactionData}
                        margin={{
                            top: 20,
                            right: 30,
                            left: 20,
                            bottom: 5,
                        }}
                    >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Bar dataKey="uv" fill="#8884d8" shape={<TriangleBar />} label={{ position: 'top' }}>
                            {transactionData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={colors[index % 20]} />
                            ))}
                        </Bar>
                    </BarChart>
                </div>
            </div>


        </div>
    );
}
