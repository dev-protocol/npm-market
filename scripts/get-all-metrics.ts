import ApolloClient, {ApolloQueryResult} from 'apollo-client'
import gql from 'graphql-tag'
import fetch from 'node-fetch'
import {createHttpLink} from 'apollo-link-http'
import {InMemoryCache} from 'apollo-cache-inmemory'

export type Metrics = {
	metrics_factory_create: Array<{
		metrics: string
	}>
}

export const getAllMetrics = async (): Promise<ApolloQueryResult<Metrics>> =>
	new ApolloClient({
		link: createHttpLink({
			uri:
				'https://dev-protocol-event-viewer.azurewebsites.net/events/v1/graphql?code=8pxrHqDXIvcIw9SiFG0ZL/NaW9lznOpf8dAlvkTtyqeY8wXW38ewdg==',
			fetch,
		}),
		cache: new InMemoryCache(),
	}).query<Metrics>({
		query: gql`
			{
				metrics_factory_create(
					where: {
						from_address: {_eq: "0x88c7B1f41DdE50efFc25541a2E0769B887eB2ee7"}
					}
				) {
					metrics
				}
			}
		`,
	})
