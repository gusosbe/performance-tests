/**
 * @NApiVersion 2.1
 * @NModuleScope SameAccount
 * @NScriptType Restlet
 * Author: Gustav Osbeck <gustav.osbeck@noresca.se>
 */
define(['N/record', 'N/search', 'N/log', 'N/query', 'N/runtime'], (record, search, log, query, runtime) => {

    const get = (requestBody) => {
        switch (requestBody.version) {
            case 'standardTest':
                return standardTest();
            case 'joinedTest':
                return joinedTest();
        }
        return JSON.stringify(requestBody);
    }

    const standardTest = () => {
        const startTime = new Date().getTime();

        const transactions = query.runSuiteQL(`SELECT id FROM transaction WHERE recordtype = 'invoice'`).asMappedResults();
        const endTime = new Date().getTime();
        const suiteQLExecutionTime = endTime - startTime;


        const searchStartTime = new Date().getTime();
        const invoiceSearch = search.create({
            type: 'invoice',
            filters: [{
                name: 'mainline',
                operator: 'is',
                values: ['T']
            }],
            columns: ['internalid']
        });

        let searchInvoices = []

        invoiceSearch.run().each(result => {
            searchInvoices.push(
                { id: result.getValue('internalid'), }
            );
            return true;
        });

        const searchEndTime = new Date().getTime();
        const searchExecutionTime = searchEndTime - searchStartTime;

        return JSON.stringify({
            suiteQLExecutionTime,
            suiteQLHits: transactions.length,
            searchExecutionTime,
            searchHits: searchInvoices.length
        });
    }

    const joinedTest = () => {


        const suiteQLStartTime = new Date().getTime();

        const suiteQLInvoices = query.runSuiteQL(`SELECT transaction.id, customer.email FROM transaction
        INNER JOIN customer ON ( customer.id = transaction.entity )
        WHERE recordtype = 'invoice'`).asMappedResults();

        const suiteQLEndTime = new Date().getTime();

        const suiteQLExecutionTime = suiteQLEndTime - suiteQLStartTime;


        const searchStartTime = new Date().getTime();

        const invoiceSearch = search.create({
            type: 'invoice',
            columns: [
                'internalid',
                search.createColumn({
                    name: "email",
                    join: "customer"
                })
            ],
            filters: [
                ['mainline', 'is', 'T']
            ]
        });

        const searchInvoices = [];

        invoiceSearch.run().each(result => {
            searchInvoices.push(
                {
                    id: result.getValue('internalid'),
                    customerEmail: result.getValue({
                        name: "email",
                        join: "customer"
                    })
                }
            );
            return true;
        });

        const searchEndTime = new Date().getTime();
        const searchExecutionTime = searchEndTime - searchStartTime;


        return JSON.stringify({
            suiteQLHits: suiteQLInvoices.length,
            suiteQLExecutionTime,
            searchHits: searchInvoices.length,
            searchExecutionTime
        });
    }

    return { get };
});