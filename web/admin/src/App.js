/*
 * Copyright 2018 DoubleDutch, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import React, { PureComponent } from 'react'
import './App.css'
import client, { translate as t, useStrings } from '@doubledutch/admin-client'
import { provideFirebaseConnectorToReactComponent } from '@doubledutch/firebase-connector'
import i18n from './i18n'
import Avatar from './Avatar'
import '@doubledutch/react-components/lib/base.css'

useStrings(i18n)

const defaultKillMethods = [
  {
    title: '📇',
    description: t('bizCardDes'),
    instructions: t('bizCardInstructions'),
  },
  {
    title: '😄',
    description: t('stickerDes'),
    instructions: t('stickerInstructions'),
  },
  {
    title: '📸',
    description: t('photoDes'),
    instructions: t('photoInstructions'),
  },
  { title: '🙂', description: '', instructions: '' },
]

class App extends PureComponent {
  state = {
    players: [],
    admins: [],
    killMethods: defaultKillMethods,
    search: '',
    searchRemove: '',
    isGameInProgress: true, // Assume game is in progress until we find out otherwise.
  }

  componentDidMount() {
    const { fbc } = this.props
    fbc.signinAdmin().then(() => {
      client.getAttendees().then(attendees => {
        this.setState({ attendees: attendees.sort(sortPlayers) })
        const usersRef = fbc.database.public.usersRef()
        usersRef.on('child_added', data => {
          const player = attendees.find(a => a.id === data.key)
          if (player) {
            this.setState(state => ({
              players: [...state.players, { ...data.val(), id: data.key }].sort(sortPlayers),
            }))
          } else {
            fbc.database.public.usersRef(data.key).remove()
          }
        })
        usersRef.on('child_removed', data => {
          this.setState(state => ({ players: state.players.filter(p => p.id !== data.key) }))
        })
        fbc.database.public.adminRef('targets').on('value', data => {
          this.setState({ isGameInProgress: !!data.val() })
        })
        fbc.database.private.adminableUsersRef().on('value', data => {
          const users = data.val() || {}
          this.setState({ admins: Object.keys(users).filter(id => users[id].adminToken) })
        })
        fbc.database.public.adminRef('killMethods').on('value', data => {
          const val = data.val()
          if (val) {
            const killMethods = Object.keys(val).reduce((arr, i) => {
              arr[+i] = { ...val[i], id: +i }
              return arr
            }, [])
            this.setState({ killMethods })
          } else {
            fbc.database.public.adminRef('killMethods').set(defaultKillMethods)
          }
        })
      })
    })
  }

  render() {
    const { attendees, killMethods, isGameInProgress, search, searchRemove, players } = this.state
    const playersFiltered = this.filteredAttendees(players, searchRemove)
    const playersById = players.reduce((players, player) => {
      players[player.id] = player
      return players
    }, {})
    const nonPlayers = attendees ? attendees.filter(a => !playersById[a.id]) : null
    const nonPlayersFiltered = this.filteredAttendees(nonPlayers, search)
    return (
      <div className="App">
        <h1 className="extTitle">{t('title')}</h1>
        {attendees ? (
          <div>
            <div className="tableContainer">
              {isGameInProgress ? (
                <div className="gameState">
                  {t('gameProgress')} <button onClick={this.abortGame}>{t('abort')}</button>
                </div>
              ) : (
                <div className="gameState">{t('noGame')}</div>
              )}
              <div className="userListContainer">
                <h4>
                  <input
                    className="searchBox"
                    value={this.state.search}
                    onChange={e => this.setState({ search: e.target.value })}
                    placeholder={t('search')}
                  />
                  {t('nonPlayers', { players: nonPlayersFiltered.length })}{' '}
                  <button
                    disabled={isGameInProgress || !nonPlayers || !nonPlayers.length}
                    onClick={() => this.addAllPlayers(nonPlayersFiltered)}
                  >
                    {t('addALL')} &gt;&gt;
                  </button>
                </h4>
                <ul className="userList">
                  {nonPlayersFiltered.map(user => this.renderUser(user, false))}
                  {nonPlayersFiltered.length === 0 && <p className="helpText">{t('noPlayers')}</p>}
                </ul>
              </div>
              <div className="userListContainer">
                <h4>
                  <input
                    className="searchBox"
                    value={this.state.searchRemove}
                    onChange={e => this.setState({ searchRemove: e.target.value })}
                    placeholder={t('search')}
                  />
                  {t('players', { players: players.length })}{' '}
                  <button
                    disabled={isGameInProgress || !players.length}
                    onClick={() => this.removeAllPlayers(playersFiltered)}
                  >
                    &lt;&lt; {t('removeALL')}
                  </button>
                </h4>
                <ul className="userList">
                  {playersFiltered.map(user => this.renderUser(user, true))}
                  {playersFiltered.length === 0 && <p className="helpText">{t('noPlayers')}</p>}
                </ul>
              </div>
            </div>
            <div className="tableContainer">
              <h4>
                {t('custom')} <button onClick={this.resetMethods}>{t('reset')}</button>
              </h4>
              <ol className="methods">
                {[0, 1, 2, 3].map(i => (
                  <li key={i}>
                    <input
                      type="text"
                      maxLength={2}
                      className="method-icon"
                      value={killMethods[i].title}
                      onChange={this.updateMethodTitle(i)}
                    />
                    <input
                      type="text"
                      maxLength={65}
                      placeholder="Description"
                      className="method-description"
                      value={killMethods[i].description}
                      onChange={this.updateMethodDescription(i)}
                    />
                    <input
                      type="text"
                      maxLength={65}
                      placeholder="Instructions"
                      className="method-instructions"
                      value={killMethods[i].instructions}
                      onChange={this.updateMethodInstructions(i)}
                    />
                    {(!killMethods[i].title.trim() ||
                      !killMethods[i].description.trim() ||
                      !killMethods[i].instructions.trim()) && (
                      <p className="methodHelpText">
                        *Please complete this section before beginning your game
                      </p>
                    )}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        ) : (
          <div>{t('loading')}</div>
        )}
      </div>
    )
  }

  filteredAttendees = (list, search) => {
    if (search.trim()) {
      return list.filter(user => {
        const name = `${user.firstName.toLowerCase()} ${user.lastName.toLowerCase()}`
        return name.includes(search.toLowerCase())
      })
    }
    return list
  }

  renderUser(user, isPlayer) {
    const { id, firstName, lastName } = user
    const action = isPlayer ? x => this.removePlayer(x) : x => this.addPlayer(x)
    const actionText = isPlayer ? t('remove') : t('add')
    return (
      <li key={id} className="userCell">
        {!this.state.isGameInProgress && (
          <button className="move" onClick={() => action(user)}>
            {actionText}
          </button>
        )}
        <Avatar user={user} size={30} />
        <p>
          {' '}
          {firstName} {lastName}
        </p>
        {this.isAdmin(id) ? (
          <button className="is admin" onClick={() => this.setAdmin(id, false)}>
            {t('removeAdmin')}
          </button>
        ) : (
          <button className="admin" onClick={() => this.setAdmin(id, true)}>
            {t('makeAdmin')}
          </button>
        )}
      </li>
    )
  }

  isAdmin(id) {
    return this.state.admins.includes(id)
  }

  setAdmin(userId, isAdmin) {
    const { fbc } = this.props
    const tokenRef = fbc.database.private.adminableUsersRef(userId).child('adminToken')
    if (isAdmin) {
      this.setState()
      fbc.getLongLivedAdminToken().then(token => tokenRef.set(token))
    } else {
      tokenRef.remove()
    }
  }

  addPlayer(user) {
    this.props.fbc.database.public.usersRef(user.id).set(user)
  }

  addAllPlayers = nonPlayers => {
    if (window.confirm(t('addAllConfirm', { players: nonPlayers.length }))) {
      nonPlayers.forEach(p => this.addPlayer(p))
      this.setState({ search: '', searchRemove: '' })
    }
  }

  removePlayer(user) {
    this.props.fbc.database.public.usersRef(user.id).remove()
  }

  removeAllPlayers = players => {
    if (window.confirm(t('removeAllConfirm', { players: players.length }))) {
      players.forEach(p => this.removePlayer(p))
      this.setState({ search: '', searchRemove: '' })
    }
  }

  abortGame = () => {
    const { fbc } = this.props
    if (window.confirm(t('abortGame', { players: this.state.players.length }))) {
      const killsRef = fbc.database.public.allRef('kills')
      const targetsRef = fbc.database.public.adminRef('targets')
      killsRef.remove()
      targetsRef.remove()
    }
  }

  updateMethodTitle = index => e =>
    this.props.fbc.database.public
      .adminRef('killMethods')
      .child(index)
      .update({ title: e.target.value })

  updateMethodDescription = index => e =>
    this.props.fbc.database.public
      .adminRef('killMethods')
      .child(index)
      .update({ description: e.target.value })

  updateMethodInstructions = index => e =>
    this.props.fbc.database.public
      .adminRef('killMethods')
      .child(index)
      .update({ instructions: e.target.value })

  resetMethods = () => {
    if (window.confirm(t('resetConfirm'))) {
      this.props.fbc.database.public.adminRef('killMethods').set(defaultKillMethods)
    }
  }
}

export default provideFirebaseConnectorToReactComponent(
  client,
  'assassins',
  (props, fbc) => <App {...props} fbc={fbc} />,
  PureComponent,
)

function sortPlayers(a, b) {
  const aFirst = (a.firstName || '').toLowerCase()
  const bFirst = (b.firstName || '').toLowerCase()
  const aLast = (a.lastName || '').toLowerCase()
  const bLast = (b.lastName || '').toLowerCase()
  if (aFirst !== bFirst) return aFirst < bFirst ? -1 : 1
  return aLast < bLast ? -1 : 1
}
