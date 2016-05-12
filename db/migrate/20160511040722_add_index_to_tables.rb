class AddIndexToTables < ActiveRecord::Migration
  def change
    add_index :servers, :name
    add_index :server_types, :name
    add_index :server_parts, :name
    add_index :detail_types, :name
    add_index :clusters, :name
  end
end
