import React from 'react';
import { LineChart, NrqlQuery, Grid, GridItem, TableChart } from 'nr1';
import { Chart, Tooltip, Legend, Polygon } from 'viser-react';
import DataSet from '@antv/data-set';
// https://docs.newrelic.com/docs/new-relic-programmable-platform-introduction

export default class Datadog2newrelicNerdletNerdlet extends React.Component {
    constructor(props) {
        super(props);
        this.accountId = 2710112;
        this.state = {
            appId: null,
            appName: null
        };
    }

    render () {
        // const { appId, appName } = this.state;
        const nrql = `SELECT average(cpuPercent) AS 'cpuPercent' FROM ProcessSample FACET processDisplayName SINCE 5 minute AGO LIMIT MAX`;

        return (
            <Grid>
                <GridItem columnSpan={12}>
                    <h1>New Relic Data Dog</h1>
                </GridItem>
                <GridItem columnSpan={6}>
                    <TableChart query={nrql} accountId={this.accountId} fullWidth fullHeight />
                </GridItem>
                <GridItem columnSpan={6}>
                    <NrqlQuery accountId={this.accountId} query={nrql}>
                        {({ data }) => {
                            const sourceData = {
                                name: 'root',
                                children: []
                            };

                            if (data) {
                                sourceData.children = data.map(
                                    ({ metadata, data }) => ({
                                        name: metadata.name,
                                        value: parseFloat(data[0].cpuPercent.toFixed(2))
                                    })
                                )

                                const busy = sourceData.children.reduce((total, { value }) => value + total, 0)
                                const free = 100 - busy

                                // sourceData.children.push({
                                //     name: "Free memory",
                                //     value: free,
                                // })
                            }

                            const dataSetView = new DataSet.View().source(sourceData, {
                                type: 'hierarchy',
                            });

                            dataSetView.transform({
                                field: 'value',
                                type: 'hierarchy.treemap',
                                tile: 'treemapResquarify',
                                as: ['x', 'y'],
                            });
                            const plotData = dataSetView.getAllNodes().map(node => ({
                                ...node,
                                name: node.data.name,
                                value: node.data.value,
                            }));
                            const scale = [{
                                dataKey: 'value',
                                nice: false,
                            }];

                            const itemTpl = `
                                <li data-index={index}>
                                    <span style="background-color:{color};" class="g2-tooltip-marker"></span>
                                    {name}<br/>
                                    <span style="padding-left: 16px">CPU %：{count}</span><br/>
                                </li>
                            `;

                            const style = {
                                lineWidth: 1,
                                stroke: '#fff',
                            };

                            const tooltip = ['name*value', (name, count) => ({ name, count })];

                            const label = ['name', {
                                offset: 0,
                                textStyle: {
                                    textBaseline: 'middle',
                                },
                                formatter (val) {
                                    if (val !== 'root') {
                                        return val;
                                    }
                                }
                            }];


                            return (
                                <Chart forceFit={true} height={400} data={plotData} scale={scale} padding={0}>
                                    <Tooltip showTitle={false} itemTpl={itemTpl} />
                                    <Polygon position="x*y" color="name" tooltip={tooltip} style={style} label={label} />
                                </Chart>
                            )
                        }}
                    </NrqlQuery>
                </GridItem>
            </Grid>
        );
    }
}
