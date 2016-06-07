class CreateServers < ActiveRecord::Migration
  def change
    create_table :servers do |t|
      t.references  :server_type
      t.string      :inventory_num
      t.string      :serial_num
      t.string      :name
      t.string      :location
      t.timestamps null: false
    end
  end
end
