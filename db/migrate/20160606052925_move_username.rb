class MoveUsername < ActiveRecord::Migration
  def change
    remove_column :users, :username, :string
    add_column    :users, :username, :string, after: :id
    add_index     :users, :username, unique: true
  end
end
