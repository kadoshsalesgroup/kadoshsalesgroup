import React, { useState, useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';
import { SaleStage } from '../../types';
import { formatCurrencyMXN, getMontoAsignado } from '../../lib/utils';
import { ArrowDownTrayIcon } from '../common/Icons';

// Declare XLSX and saveAs as global variables
declare var XLSX: any;
declare var saveAs: any;

const CommissionCalculator = () => {
    const { asesores, ventas } = useAppContext();
    const [currentDate, setCurrentDate] = useState(new Date());

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth(); // 0-11 for Date object compatibility

    const commissionData = useMemo(() => {
        const activeAsesores = asesores.filter(a => a.estatus === 'Activo');

        return activeAsesores.map(asesor => {
            const advisorSalesThisMonth = ventas.filter(v => {
                const saleDate = new Date(v.fechaCierre || v.fechaInicioProceso);
                return (v.asesorPrincipalId === asesor.id || v.asesorSecundarioId === asesor.id) &&
                       v.etapaProceso === SaleStage.Contratado &&
                       saleDate.getFullYear() === year &&
                       saleDate.getMonth() === month;
            });

            const montoTotalVendido = advisorSalesThisMonth.reduce((sum, v) => sum + getMontoAsignado(v, asesor.id), 0);

            const comision = montoTotalVendido * 0.03;

            return {
                asesorId: asesor.id,
                nombreCompleto: asesor.nombreCompleto,
                montoTotalVendido,
                comision,
            };
        }).sort((a, b) => b.comision - a.comision); // Sort by commission descending
    }, [asesores, ventas, year, month]);

    const changeMonth = (offset: number) => {
        setCurrentDate(prev => {
            const newDate = new Date(prev);
            newDate.setMonth(newDate.getMonth() + offset);
            return newDate;
        });
    };
    
    const handleExport = () => {
        const dataToExport = commissionData.map(data => ({
            'Asesor': data.nombreCompleto,
            'Monto total vendido': data.montoTotalVendido,
            'Comisión (3%)': data.comision,
        }));
        
        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        
        // Formatting numbers as currency in Excel
        const range = XLSX.utils.decode_range(worksheet['!ref']);
        for (let R = range.s.r + 1; R <= range.e.r; ++R) {
            for (let C = range.s.c + 1; C <= range.e.c; ++C) { // Skip first column (Name)
                const cell_address = { c: C, r: R };
                const cell_ref = XLSX.utils.encode_cell(cell_address);
                if (worksheet[cell_ref]) {
                    worksheet[cell_ref].t = 'n';
                    worksheet[cell_ref].z = '$#,##0.00';
                }
            }
        }

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Comisiones");
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        const data = new Blob([excelBuffer], {type: "application/octet-stream"});
        saveAs(data, `comisiones_${year}_${String(month + 1).padStart(2, '0')}.xlsx`);
    };

    return (
        <div className="p-4 md:p-6 lg:p-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                    <h1 className="text-2xl font-bold text-maderas-blue">Calculadora de Comisiones</h1>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                             <button onClick={() => changeMonth(-1)} className="p-2 rounded-full hover:bg-gray-100" aria-label="Mes anterior">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" /></svg>
                            </button>
                            <span className="font-semibold text-lg w-48 text-center capitalize">
                                {currentDate.toLocaleString('es-MX', { month: 'long', year: 'numeric' })}
                            </span>
                            <button onClick={() => changeMonth(1)} className="p-2 rounded-full hover:bg-gray-100" aria-label="Siguiente mes">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg>
                            </button>
                        </div>
                        <button onClick={handleExport} className="flex items-center gap-2 bg-blue-100 text-blue-700 px-3 py-2 rounded-md hover:bg-blue-200 text-sm">
                            <ArrowDownTrayIcon className="w-4 h-4" /> Exportar a Excel
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-600">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                            <tr>
                                <th className="px-4 py-3">Asesor</th>
                                <th className="px-4 py-3">Monto total vendido</th>
                                <th className="px-4 py-3">Comisión (3%)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {commissionData.map(data => (
                                <tr key={data.asesorId} className="border-b hover:bg-gray-50">
                                    <td className="px-4 py-2 font-medium text-gray-900">{data.nombreCompleto}</td>
                                    <td className="px-4 py-2">{formatCurrencyMXN(data.montoTotalVendido)}</td>
                                    <td className="px-4 py-2 font-bold text-emerald-600">{formatCurrencyMXN(data.comision)}</td>
                                </tr>
                            ))}
                            {commissionData.length === 0 && (
                                <tr>
                                    <td colSpan={3} className="text-center py-4 text-gray-500">
                                        No hay datos de comisiones para el mes seleccionado.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default CommissionCalculator;