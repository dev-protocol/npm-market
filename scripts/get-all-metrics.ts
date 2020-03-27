import ApolloClient, {ApolloQueryResult} from 'apollo-client'
import gql from 'graphql-tag'
import nodeFetch, {RequestInfo, RequestInit} from 'node-fetch'
import {createHttpLink} from 'apollo-link-http'
import {InMemoryCache} from 'apollo-cache-inmemory'
import {config} from 'dotenv'

export type Metrics = {
	// eslint-disable-next-line @typescript-eslint/camelcase
	metrics_factory_create: Array<{
		metrics: string
	}>
}

const fetch = async (
	url: RequestInfo,
	init?: RequestInit | undefined
): ReturnType<typeof nodeFetch> =>
	nodeFetch(url, {
		...init,
		...{
			headers: {'x-hasura-admin-secret': config().parsed!.HASURA_ADMIN_SECRET}
		}
	})

export const getAllMetrics = async (): Promise<ApolloQueryResult<Metrics>> =>
	new ApolloClient({
		link: createHttpLink({
			uri: 'https://devprtcl-event.azurewebsites.net/v1/graphql',
			fetch
		}),
		cache: new InMemoryCache()
	}).query<Metrics>({
		query: gql`
			{
				metrics_factory_create {
					metrics
				}
			}
		`
	})
